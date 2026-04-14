import { NextResponse } from 'next/server';
import { issueSessionCookie, phraseMatches } from '@/lib/auth';

export async function POST(req: Request) {
  let phrase = '';
  try {
    const body = (await req.json()) as { phrase?: unknown };
    if (typeof body.phrase === 'string') phrase = body.phrase;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!phraseMatches(phrase)) {
    return NextResponse.json({ error: 'Invalid passphrase' }, { status: 401 });
  }

  const cookie = issueSessionCookie();
  const res = NextResponse.json({ ok: true });
  res.cookies.set(cookie);
  return res;
}
