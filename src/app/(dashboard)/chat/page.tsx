"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Citation {
  label: string;
  color: string;
}

interface Confidence {
  level: string;
  color: string;
}

interface Message {
  id: string;
  role: "user" | "assistant" | "typing";
  content: string;
  citations?: Citation[];
  confidence?: Confidence;
  disclaimer?: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}

// ─── Mock AI response logic ──────────────────────────────────────────────────

function generateMockResponse(userMessage: string): Omit<Message, "id" | "timestamp"> {
  const lower = userMessage.toLowerCase();

  if (
    lower.includes("cirugia") ||
    lower.includes("operacion") ||
    lower.includes("rodilla")
  ) {
    return {
      role: "assistant",
      content: `Basandome en tus polizas vigentes, tienes cobertura combinada para una cirugia de rodilla. Aqui va el desglose:

**1. Seguro Complementario Salud - MetLife**
- Cobertura quirurgica: hasta $2.500.000 CLP por evento
- Deducible aplicable: $200.000 CLP
- Copago: 20% sobre el monto cubierto
- Cobertura neta estimada: **$2.500.000 CLP**

**2. Seguro Hospitalizacion - Consorcio**
- Cobertura por hospitalizacion asociada: hasta $1.100.000 CLP
- Deducible: $100.000 CLP
- Cobertura neta estimada: **$1.100.000 CLP**

**Resumen estimado:**
- Cobertura total combinada: **$3.600.000 CLP**
- Tu gasto de bolsillo estimado: **$900.000 CLP**

Ten en cuenta que estos montos son aproximados y dependen de la red de prestadores, convenios vigentes y condiciones especificas de cada poliza.`,
      citations: [
        {
          label: "Poliza MetLife, Pag 12",
          color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        },
        {
          label: "Poliza Consorcio, Pag 8",
          color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        },
      ],
      confidence: {
        level: "Alta confianza",
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
      disclaimer:
        "Esta respuesta es orientativa y no reemplaza asesoria profesional. Consulta con tu aseguradora para montos definitivos.",
    };
  }

  if (lower.includes("hospital") || lower.includes("hospitalizacion")) {
    return {
      role: "assistant",
      content: `Para una hospitalizacion de 3 dias, el costo estimado es de **$1.800.000 CLP**. Tus coberturas aplican asi:

**1. Seguro Complementario Salud - MetLife**
- Tarifa diaria cubierta: hasta $350.000 CLP/dia
- Gastos de sala y pension incluidos
- Cobertura estimada para 3 dias: **$1.400.000 CLP**

**2. Seguro Hospitalizacion - Consorcio**
- Complemento diario: $100.000 CLP/dia
- Cobertura estimada para 3 dias: **$300.000 CLP**

**Resumen estimado:**
- Cobertura total combinada: **$1.700.000 CLP**
- Tu gasto de bolsillo estimado: **$100.000 CLP**

Recuerda utilizar prestadores dentro de la red convenida para obtener estos montos.`,
      citations: [
        {
          label: "Poliza MetLife, Pag 15",
          color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
        },
        {
          label: "Poliza Consorcio, Pag 10",
          color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        },
      ],
      confidence: {
        level: "Alta confianza",
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
      disclaimer:
        "Esta respuesta es orientativa y no reemplaza asesoria profesional. Consulta con tu aseguradora para montos definitivos.",
    };
  }

  if (
    lower.includes("auto") ||
    lower.includes("vehiculo") ||
    lower.includes("choque")
  ) {
    return {
      role: "assistant",
      content: `Tu seguro automotriz cubre este tipo de evento. Aqui el detalle:

**Seguro Automotriz - BCI Seguros**
- Cobertura por danos: hasta **$15.000.000 CLP**
- Deducible: 3 UF (~$110.000 CLP)
- Incluye: danos propios, danos a terceros, robo parcial y total
- Grua incluida hasta 100 km

**Resumen estimado:**
- Cobertura maxima: **$15.000.000 CLP**
- Deducible a pagar: **$110.000 CLP** (3 UF)

Para hacer efectiva la cobertura, debes hacer la denuncia dentro de las primeras 48 horas del siniestro y presentar el parte policial si corresponde.`,
      citations: [
        {
          label: "Poliza BCI Auto, Pag 5",
          color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        },
        {
          label: "Poliza BCI Auto, Pag 9",
          color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
        },
      ],
      confidence: {
        level: "Alta confianza",
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
      disclaimer:
        "Esta respuesta es orientativa y no reemplaza asesoria profesional. Consulta con tu aseguradora para montos definitivos.",
    };
  }

  if (
    lower.includes("hogar") ||
    lower.includes("incendio") ||
    lower.includes("casa")
  ) {
    return {
      role: "assistant",
      content: `Tu seguro de hogar te protege ante varios siniestros. Aqui el detalle:

**Seguro de Hogar - Consorcio**
- Cobertura por incendio: hasta **$80.000.000 CLP** (valor del inmueble)
- Cobertura por contenido: hasta **$15.000.000 CLP**
- Cobertura por terremoto: hasta **$60.000.000 CLP** (2% deducible sobre monto asegurado)
- Responsabilidad civil: **$5.000.000 CLP**
- Robo con fuerza: hasta **$8.000.000 CLP**

**Importante:**
- Deducible general: 1 UF (~$37.000 CLP)
- Deducible terremoto: 2% del monto asegurado
- La poliza exige medidas minimas de seguridad (cerraduras, extintores)`,
      citations: [
        {
          label: "Poliza Hogar Consorcio, Pag 3",
          color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        },
        {
          label: "Poliza Hogar Consorcio, Pag 7",
          color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        },
      ],
      confidence: {
        level: "Alta confianza",
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
      disclaimer:
        "Esta respuesta es orientativa y no reemplaza asesoria profesional. Consulta con tu aseguradora para montos definitivos.",
    };
  }

  if (lower.includes("vida") || lower.includes("fallecimiento")) {
    return {
      role: "assistant",
      content: `Tu seguro de vida con Consorcio te otorga la siguiente proteccion:

**Seguro de Vida - Consorcio**
- Capital asegurado por fallecimiento: **$50.000.000 CLP**
- Muerte accidental (doble indemnizacion): **$100.000.000 CLP**
- Invalidez total y permanente: **$50.000.000 CLP**
- Enfermedades graves (cancer, infarto, ACV): **$25.000.000 CLP**

**Beneficiarios registrados:**
- Conyuge: 60%
- Hijos: 40% (partes iguales)

**Estado:** Poliza vigente, prima al dia. Proxima renovacion: Diciembre 2026.`,
      citations: [
        {
          label: "Poliza Vida Consorcio, Pag 2",
          color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        },
        {
          label: "Poliza Vida Consorcio, Pag 6",
          color: "bg-purple-500/20 text-purple-400 border-purple-500/30",
        },
      ],
      confidence: {
        level: "Alta confianza",
        color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
      },
      disclaimer:
        "Esta respuesta es orientativa y no reemplaza asesoria profesional. Consulta con tu aseguradora para montos definitivos.",
    };
  }

  // Default response
  return {
    role: "assistant",
    content:
      "Basandome en tus polizas cargadas, puedo ayudarte con consultas sobre coberturas de salud, vehiculo, hogar y vida. ¿Que te gustaria saber?\n\nPrueba preguntarme cosas como:\n- \"¿Que cubre mi seguro si me opero de la rodilla?\"\n- \"¿Cuanto cubre mi seguro si choco el auto?\"\n- \"¿Que pasa si hay un incendio en mi casa?\"\n- \"¿Cuanto es mi seguro de vida?\"",
    confidence: {
      level: "Media",
      color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    },
    disclaimer:
      "Esta respuesta es orientativa y no reemplaza asesoria profesional.",
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getTimeString(): string {
  const now = new Date();
  return now.toLocaleTimeString("es-CL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 12);
}

// ─── Typing indicator component ──────────────────────────────────────────────

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

// ─── Main component ──────────────────────────────────────────────────────────

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: "conv-1",
      title: "Nueva conversacion",
      messages: [],
      createdAt: getTimeString(),
    },
  ]);
  const [activeConvId, setActiveConvId] = useState("conv-1");
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find((c) => c.id === activeConvId)!;

  // Scroll to bottom on new messages or typing
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConv.messages, isTyping]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  const handleSend = useCallback(() => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: Message = {
      id: generateId(),
      role: "user",
      content: text,
      timestamp: getTimeString(),
    };

    // Update conversation: add user message, auto-generate title from first message
    setConversations((prev) =>
      prev.map((conv) => {
        if (conv.id !== activeConvId) return conv;
        const isFirstMessage = conv.messages.length === 0;
        return {
          ...conv,
          title: isFirstMessage
            ? text.length > 35
              ? text.substring(0, 35) + "..."
              : text
            : conv.title,
          messages: [...conv.messages, userMsg],
        };
      })
    );

    setInputValue("");
    setIsTyping(true);

    // Show typing indicator for 1.5s, then generate response after another 1.5s
    setTimeout(() => {
      // Typing is already showing, now after another 1.5s show the response
      setTimeout(() => {
        const mockResponse = generateMockResponse(text);
        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          content: mockResponse.content,
          citations: mockResponse.citations,
          confidence: mockResponse.confidence,
          disclaimer: mockResponse.disclaimer,
          timestamp: getTimeString(),
        };

        setConversations((prev) =>
          prev.map((conv) => {
            if (conv.id !== activeConvId) return conv;
            return {
              ...conv,
              messages: [...conv.messages, assistantMsg],
            };
          })
        );
        setIsTyping(false);
      }, 1500);
    }, 1500);
  }, [inputValue, isTyping, activeConvId]);

  const handleNewConversation = () => {
    const newId = "conv-" + generateId();
    const newConv: Conversation = {
      id: newId,
      title: "Nueva conversacion",
      messages: [],
      createdAt: getTimeString(),
    };
    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newId);
    setInputValue("");
    setIsTyping(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
          {conversations.map((conv) => {
            const lastMsg =
              conv.messages.length > 0
                ? conv.messages[conv.messages.length - 1]
                : null;
            const preview = lastMsg
              ? lastMsg.content.substring(0, 50) +
                (lastMsg.content.length > 50 ? "..." : "")
              : "Sin mensajes aun";

            return (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left p-4 border-b border-[#2d3548]/50 transition-colors ${
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
                      {conv.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#94a3b8]">
                      {preview}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-xs text-[#94a3b8]">
                      <Clock className="h-3 w-3" />
                      <span>{conv.createdAt}</span>
                      <span className="text-[#2d3548]">|</span>
                      <span>{conv.messages.length} mensajes</span>
                    </div>
                  </div>
                  <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-[#94a3b8]/50" />
                </div>
              </button>
            );
          })}
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
          {/* Welcome message when no messages */}
          {activeConv.messages.length === 0 && !isTyping && (
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
                    onClick={() => {
                      setInputValue(suggestion);
                      textareaRef.current?.focus();
                    }}
                    className="rounded-xl border border-[#2d3548] bg-[#1c2333] px-3 py-2 text-xs text-[#94a3b8] hover:bg-[#2d3548] hover:text-[#e2e8f0] transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Rendered messages */}
          {activeConv.messages.map((message) => (
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
                        {message.confidence && (
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${message.confidence.color}`}
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            {message.confidence.level}
                          </span>
                        )}
                        {message.citations?.map((citation, idx) => (
                          <span
                            key={idx}
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${citation.color}`}
                          >
                            {citation.label}
                          </span>
                        ))}
                      </div>
                      {message.disclaimer && (
                        <div className="flex items-start gap-1.5 mt-1">
                          <AlertCircle className="h-3 w-3 shrink-0 mt-0.5 text-[#94a3b8]/60" />
                          <p className="text-xs text-[#94a3b8]/60 italic">
                            {message.disclaimer}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Timestamp */}
                  <p
                    className={`mt-1 text-xs text-[#94a3b8] ${
                      message.role === "user" ? "text-right" : "text-left"
                    }`}
                  >
                    {message.timestamp}
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
              onClick={handleSend}
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
