"use client";

import { useState, useRef, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  MessageSquare,
  Send,
  Plus,
  Bot,
  User,
  Clock,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Trash2,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Citation {
  fileName: string;
  pageNumber: number | null;
  section: string | null;
  chunkId: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  confidenceLabel?: string | null;
  createdAt: string;
}

interface ConversationPreview {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessage: {
    content: string;
    role: string;
    createdAt: string;
  } | null;
  messageCount: number;
}

// ─── Confidence mapping ─────────────────────────────────────────────────────

const CONFIDENCE_MAP: Record<string, { level: string; color: string }> = {
  HIGH: {
    level: "Alta confianza",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  },
  MEDIUM: {
    level: "Confianza media",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  LOW: {
    level: "Confianza baja",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  UNCERTAIN: {
    level: "Incierto",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

// ─── Citation color palette ─────────────────────────────────────────────────

const CITATION_COLORS = [
  "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "bg-teal-500/20 text-teal-400 border-teal-500/30",
];

function getCitationColor(index: number): string {
  return CITATION_COLORS[index % CITATION_COLORS.length];
}

function formatCitationLabel(citation: Citation): string {
  let label = citation.fileName;
  if (citation.pageNumber) label += `, Pag ${citation.pageNumber}`;
  if (citation.section) label += ` - ${citation.section}`;
  return label;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseCitations(raw: string | null | undefined): Citation[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// ─── Map API message to local Message type ──────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapApiMessage(msg: any): Message {
  return {
    id: msg.id,
    role: msg.role === "USER" ? "user" : "assistant",
    content: msg.content,
    citations: parseCitations(msg.citations),
    confidenceLabel: msg.confidenceLabel ?? null,
    createdAt: msg.createdAt,
  };
}

// ─── Typing indicator component ─────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="flex max-w-[75%] gap-3">
        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500">
          <Bot className="h-4 w-4 text-white" />
        </div>
        <div className="rounded-2xl bg-[#1c2333] border border-[#2d3548] px-4 py-3">
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-[#94a3b8] mr-2">Escribiendo</span>
            <span
              className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="inline-block h-2 w-2 rounded-full bg-blue-400 animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function ChatPage() {
  return (
    <Suspense fallback={null}>
      <ChatPageInner />
    </Suspense>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isLoadingConvs, setIsLoadingConvs] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const initialLoadDone = useRef(false);

  // ── Fetch conversation list ───────────────────────────────────────────────

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch("/api/chat");
      const json = await res.json();
      if (json.success) {
        setConversations(json.data.items ?? []);
      }
    } catch {
      // silent fail for list
    } finally {
      setIsLoadingConvs(false);
    }
  }, []);

  // ── Fetch messages for a conversation ─────────────────────────────────────

  const loadConversation = useCallback(async (convId: string) => {
    setIsLoadingMessages(true);
    setMessages([]);
    setActiveConvId(convId);
    setError(null);

    try {
      const res = await fetch(`/api/chat/${convId}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Error al cargar conversacion");
        setActiveConvId(null);
        return;
      }

      const apiMessages = (json.data.messages ?? []).map(mapApiMessage);
      setMessages(apiMessages);
    } catch {
      setError("Error de conexion al cargar la conversacion");
      setActiveConvId(null);
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // ── Initial load ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (initialLoadDone.current) return;
    initialLoadDone.current = true;

    fetchConversations().then(() => {
      const convParam = searchParams.get("conv");
      if (convParam) {
        loadConversation(convParam);
      }
    });
  }, [fetchConversations, loadConversation, searchParams]);

  // ── Scroll to bottom on new messages or typing ────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Auto-resize textarea ──────────────────────────────────────────────────

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  // ── Create new conversation ───────────────────────────────────────────────

  const handleNewConversation = useCallback(async () => {
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const json = await res.json();

      if (!json.success) {
        setError(json.error ?? "Error al crear conversacion");
        return;
      }

      const conv = json.data.conversation;
      const newPreview: ConversationPreview = {
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        lastMessage: null,
        messageCount: 0,
      };

      setConversations((prev) => [newPreview, ...prev]);
      setActiveConvId(conv.id);
      setMessages([]);
      setInputValue("");
      setIsTyping(false);

      // Update URL without full reload
      router.replace(`/chat?conv=${conv.id}`, { scroll: false });
    } catch {
      setError("Error de conexion al crear conversacion");
    }
  }, [router]);

  // ── Send message ──────────────────────────────────────────────────────────

  const handleSend = useCallback(
    async (textOverride?: string) => {
      const text = (textOverride ?? inputValue).trim();
      if (!text || isTyping) return;

      // If no active conversation, create one first
      let convId = activeConvId;

      if (!convId) {
        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          });
          const json = await res.json();

          if (!json.success) {
            setError(json.error ?? "Error al crear conversacion");
            return;
          }

          const conv = json.data.conversation;
          convId = conv.id;

          const newPreview: ConversationPreview = {
            id: conv.id,
            title: conv.title,
            createdAt: conv.createdAt,
            updatedAt: conv.updatedAt,
            lastMessage: null,
            messageCount: 0,
          };

          setConversations((prev) => [newPreview, ...prev]);
          setActiveConvId(conv.id);
          router.replace(`/chat?conv=${conv.id}`, { scroll: false });
        } catch {
          setError("Error de conexion al crear conversacion");
          return;
        }
      }

      // Optimistic: add user message immediately
      const tempUserMsg: Message = {
        id: "temp-" + Date.now(),
        role: "user",
        content: text,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, tempUserMsg]);
      setInputValue("");
      setIsTyping(true);
      setError(null);

      try {
        const res = await fetch(`/api/chat/${convId}/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: text }),
        });
        const json = await res.json();

        if (!json.success) {
          setIsTyping(false);
          setError(json.error ?? "Error al enviar mensaje");
          // Remove optimistic message
          setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
          return;
        }

        const realUserMsg = mapApiMessage(json.data.userMessage);
        const assistantMsg = mapApiMessage(json.data.assistantMessage);

        // Replace temp message with real one, add assistant response
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          realUserMsg,
          assistantMsg,
        ]);

        // Update conversation list (title may have changed, messageCount, lastMessage)
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id !== convId) return c;
            return {
              ...c,
              title:
                c.messageCount === 0
                  ? text.length > 50
                    ? text.substring(0, 50) + "..."
                    : text
                  : c.title,
              messageCount: c.messageCount + 2,
              lastMessage: {
                content: assistantMsg.content,
                role: "ASSISTANT",
                createdAt: assistantMsg.createdAt,
              },
              updatedAt: new Date().toISOString(),
            };
          })
        );
      } catch {
        setError("Error de conexion al enviar mensaje");
        setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      } finally {
        setIsTyping(false);
      }
    },
    [inputValue, isTyping, activeConvId, router]
  );

  // ── Delete conversation ───────────────────────────────────────────────────

  const handleDeleteConversation = useCallback(
    async (convId: string, e: React.MouseEvent) => {
      e.stopPropagation();

      try {
        const res = await fetch(`/api/chat/${convId}`, { method: "DELETE" });
        const json = await res.json();

        if (json.success) {
          setConversations((prev) => prev.filter((c) => c.id !== convId));
          if (activeConvId === convId) {
            setActiveConvId(null);
            setMessages([]);
            router.replace("/chat", { scroll: false });
          }
        }
      } catch {
        // silent fail
      }
    },
    [activeConvId, router]
  );

  // ── Keyboard ──────────────────────────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── Handle clicking a conversation ────────────────────────────────────────

  const handleSelectConversation = (convId: string) => {
    if (convId === activeConvId) return;
    loadConversation(convId);
    router.replace(`/chat?conv=${convId}`, { scroll: false });
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-5rem)] gap-0 -m-6">
      {/* ── Left sidebar ── */}
      <div className="hidden md:flex w-80 flex-col border-r border-[#2d3548] bg-[#0f1117]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#2d3548]">
          <h2 className="text-lg font-semibold text-[#e2e8f0]">
            Conversaciones
          </h2>
          <button
            onClick={handleNewConversation}
            className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:from-blue-500 hover:to-cyan-400 hover:shadow-lg hover:shadow-blue-500/25"
          >
            <Plus className="h-3.5 w-3.5" />
            Nueva conversacion
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {isLoadingConvs ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-4">
              <MessageSquare className="h-8 w-8 text-[#94a3b8]/40 mb-2" />
              <p className="text-sm text-[#94a3b8]">
                No hay conversaciones aun
              </p>
              <p className="text-xs text-[#94a3b8]/60 mt-1">
                Crea una nueva para comenzar
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const preview = conv.lastMessage
                ? conv.lastMessage.content.substring(0, 50) +
                  (conv.lastMessage.content.length > 50 ? "..." : "")
                : "Sin mensajes aun";
              const title = conv.title || "Nueva conversacion";

              return (
                <button
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={`group w-full text-left p-4 border-b border-[#2d3548]/50 transition-colors ${
                    activeConvId === conv.id
                      ? "bg-[#1c2333] border-l-2 border-l-blue-500"
                      : "hover:bg-[#1c2333]/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
                      <MessageSquare className="h-4 w-4 text-blue-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[#e2e8f0]">
                        {title}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[#94a3b8]">
                        {preview}
                      </p>
                      <div className="mt-1.5 flex items-center gap-2 text-xs text-[#94a3b8]">
                        <Clock className="h-3 w-3" />
                        <span>{formatTime(conv.updatedAt)}</span>
                        <span className="text-[#2d3548]">|</span>
                        <span>{conv.messageCount} mensajes</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDeleteConversation(conv.id, e)}
                        className="hidden group-hover:flex h-6 w-6 items-center justify-center rounded text-[#94a3b8]/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Eliminar conversacion"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#94a3b8]/50" />
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right - Main chat area ── */}
      <div className="flex flex-1 flex-col bg-[#0f1117]">
        {/* Chat header */}
        <div className="flex items-center gap-3 border-b border-[#2d3548] px-6 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-[#e2e8f0]">
              Asistente de Seguros IA
            </h1>
            <p className="text-xs text-[#94a3b8]">
              Consulta sobre tus polizas y coberturas
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs text-emerald-400">En linea</span>
          </div>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
          {/* Loading state for messages */}
          {isLoadingMessages && (
            <div className="flex items-center justify-center h-full">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
                <p className="text-sm text-[#94a3b8]">
                  Cargando mensajes...
                </p>
              </div>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="flex justify-center">
              <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            </div>
          )}

          {/* Welcome message when no messages and no conversation selected */}
          {messages.length === 0 && !isTyping && !isLoadingMessages && (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500">
                <Bot className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[#e2e8f0]">
                  ¿En que puedo ayudarte?
                </h2>
                <p className="mt-1 text-sm text-[#94a3b8] max-w-md">
                  Preguntame sobre tus polizas y coberturas. Puedo ayudarte con
                  consultas de salud, vehiculo, hogar y vida.
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {[
                  "¿Que cubre mi seguro si me opero de la rodilla?",
                  "¿Cuanto cubre si choco el auto?",
                  "Cobertura por hospitalizacion",
                  "Seguro de vida",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    className="rounded-xl border border-[#2d3548] bg-[#1c2333] px-3 py-2 text-xs text-[#94a3b8] hover:bg-[#2d3548] hover:text-[#e2e8f0] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rendered messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`flex max-w-[75%] gap-3 ${
                  message.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    message.role === "user"
                      ? "bg-blue-600"
                      : "bg-gradient-to-br from-blue-600 to-cyan-500"
                  }`}
                >
                  {message.role === "user" ? (
                    <User className="h-4 w-4 text-white" />
                  ) : (
                    <Bot className="h-4 w-4 text-white" />
                  )}
                </div>

                {/* Message bubble */}
                <div>
                  <div
                    className={`rounded-2xl px-4 py-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-[#1c2333] border border-[#2d3548] text-[#e2e8f0]"
                    }`}
                  >
                    <div className="text-sm leading-relaxed whitespace-pre-line">
                      {message.content}
                    </div>
                  </div>

                  {/* Citations, confidence, disclaimer for assistant */}
                  {message.role === "assistant" && (
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        {message.confidenceLabel &&
                          CONFIDENCE_MAP[message.confidenceLabel] && (
                            <span
                              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${CONFIDENCE_MAP[message.confidenceLabel].color}`}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              {CONFIDENCE_MAP[message.confidenceLabel].level}
                            </span>
                          )}
                        {message.citations?.map((citation, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getCitationColor(idx)}`}
                          >
                            {formatCitationLabel(citation)}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-start gap-1.5 mt-1">
                        <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-[#94a3b8]/60" />
                        <p className="text-xs text-[#94a3b8]/60 italic">
                          Esta respuesta es orientativa y no reemplaza asesoria
                          profesional. Consulta con tu aseguradora para montos
                          definitivos.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className={`mt-1 text-xs text-[#94a3b8] ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </p>
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && <TypingIndicator />}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <div className="border-t border-[#2d3548] px-6 py-4">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregunta sobre tus seguros..."
                rows={1}
                className="w-full resize-none rounded-xl border border-[#2d3548] bg-[#1c2333] px-4 py-3 text-sm text-[#e2e8f0] placeholder-[#94a3b8]/50 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
              />
            </div>
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white transition-all ${
                inputValue.trim() && !isTyping
                  ? "bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer"
                  : "bg-[#2d3548] cursor-not-allowed opacity-50"
              }`}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
