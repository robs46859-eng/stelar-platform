import { config } from '../config.js';

export async function generateWithGemma(prompt: string): Promise<string> {
  const res = await fetch(`${config.gatewayUrl}/v1/ai/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.gatewayApiKey}`,
    },
    body: JSON.stringify({
      model: 'gemma4:26b',
      messages: [{ role: 'user', content: prompt }],
      provider_hint: 'gemma4_26b_ollama_vm',
    }),
  });
  const data = await res.json() as { output_text: string };
  return data.output_text;
}
