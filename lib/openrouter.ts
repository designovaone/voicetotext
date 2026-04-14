import type { AudioFormat } from './types';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const TRANSCRIBE_MODEL = 'google/gemini-2.5-flash';
const TRANSFORM_MODEL = 'anthropic/claude-haiku-4.5';

const TRANSCRIBE_PROMPT =
  'Transcribe this audio verbatim. The speaker has a German accent speaking English.';

const TRANSFORM_PROMPT = (raw: string) =>
  `Clean up this transcription. Fix grammar, remove filler words, improve clarity. Keep the original meaning and tone. Return only the cleaned text, nothing else.\n\n${raw}`;

function apiKey(): string {
  const k = process.env.OPENROUTER_API_KEY;
  if (!k) throw new Error('OPENROUTER_API_KEY is not set');
  return k;
}

async function callOpenRouter(body: unknown): Promise<string> {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${errText.slice(0, 500)}`);
  }
  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenRouter returned empty content');
  }
  return content.trim();
}

export async function transcribeAudio(
  base64: string,
  format: AudioFormat,
): Promise<string> {
  return callOpenRouter({
    model: TRANSCRIBE_MODEL,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'text', text: TRANSCRIBE_PROMPT },
          { type: 'input_audio', input_audio: { data: base64, format } },
        ],
      },
    ],
  });
}

export async function transformText(raw: string): Promise<string> {
  return callOpenRouter({
    model: TRANSFORM_MODEL,
    temperature: 0,
    messages: [
      {
        role: 'user',
        content: TRANSFORM_PROMPT(raw),
      },
    ],
  });
}
