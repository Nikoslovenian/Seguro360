import { redirect } from "next/navigation";

interface ConversationPageProps {
  params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({ params }: ConversationPageProps) {
  const { conversationId } = await params;
  redirect(`/chat?conv=${encodeURIComponent(conversationId)}`);
}
