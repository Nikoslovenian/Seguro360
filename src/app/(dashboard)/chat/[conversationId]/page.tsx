import { redirect } from "next/navigation";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  // For now, redirect to the main chat page
  // In production, this would load a specific conversation by ID
  const { conversationId: _conversationId } = await params;
  redirect("/chat");
}
