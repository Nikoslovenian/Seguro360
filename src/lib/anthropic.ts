import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export function getAnthropicClient(): Anthropic {
  if (globalForAnthropic.anthropic) return globalForAnthropic.anthropic;

  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("[anthropic] ANTHROPIC_API_KEY not set - Claude API calls will fail");
  }

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: 60_000,
    maxRetries: 2,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForAnthropic.anthropic = client;
  }

  return client;
}
