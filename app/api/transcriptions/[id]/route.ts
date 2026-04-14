import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { sql } from '@/lib/db';
import { transcribeAudio, transformText } from '@/lib/openrouter';
import { mimeToFormat, type Transcription } from '@/lib/types';

export const runtime = 'nodejs';
export const maxDuration = 60;

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: idRaw } = await ctx.params;
  const id = parseId(idRaw);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
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
      UPDATE transcriptions
      SET text = text || E'\n' || ${cleaned},
          segments = segments + 1,
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, text, segments, created_at, updated_at
    `) as Transcription[];

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(rows[0]);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: idRaw } = await ctx.params;
  const id = parseId(idRaw);
  if (id === null) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  try {
    const rows = (await sql`
      DELETE FROM transcriptions WHERE id = ${id} RETURNING id
    `) as Array<{ id: number }>;
    if (rows.length === 0) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
