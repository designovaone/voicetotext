import { NextResponse } from 'next/server';
import { isAuthed } from '@/lib/auth';
import { sql } from '@/lib/db';
import type { Transcription } from '@/lib/types';

export const runtime = 'nodejs';

export async function GET() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const rows = (await sql`
      SELECT id, text, segments, created_at, updated_at
      FROM transcriptions
      ORDER BY created_at DESC
    `) as Transcription[];
    return NextResponse.json({ transcriptions: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  if (!(await isAuthed())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    await sql`DELETE FROM transcriptions`;
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
