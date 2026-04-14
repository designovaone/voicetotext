import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { sql } from '@/lib/db';
import { transcribeAudio, transformText } from '@/lib/openrouter';
import { mimeToFormat, type Transcription } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }

  const audio = form.get('audio');
  const mimeType = form.get('mimeType');
  if (!(audio instanceof Blob) || typeof mimeType !== 'string') {
    return NextResponse.json(
      { error: 'Missing audio or mimeType' },
      { status: 400 },
    );
  }

  const format = mimeToFormat(mimeType);
  if (!format) {
    return NextResponse.json(
      { error: `Unsupported mimeType: ${mimeType}` },
      { status: 400 },
    );
  }

  try {
    const buf = Buffer.from(await audio.arrayBuffer());
    const base64 = buf.toString('base64');
    const raw = await transcribeAudio(base64, format);
    const cleaned = await transformText(raw);

    const rows = (await sql`
      INSERT INTO transcriptions (text)
      VALUES (${cleaned})
      RETURNING id, text, segments, created_at, updated_at
    `) as Transcription[];

    return NextResponse.json(rows[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
