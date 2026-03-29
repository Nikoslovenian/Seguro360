import Anthropic from "@anthropic-ai/sdk";

const globalForAnthropic = globalThis as unknown as {
  anthropic: Anthropic | undefined;
};

export function getAnthropicClient(): Anthropic {
  if (globalForAnthropic.anthropic) return globalForAnthropic.anthropic;

  const client = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  if (process.env.NODE_ENV !== "production") {
    globalForAnthropic.anthropic = client;
  }

  return client;
}
