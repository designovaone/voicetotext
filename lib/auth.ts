import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'vt_session';
const MAX_AGE_SECONDS = 60 * 60 * 24; // 24h

function secret(): string {
  const s = process.env.UNLOCK_PHRASE;
  if (!s) throw new Error('UNLOCK_PHRASE is not set');
  return s;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('hex');
}

export function phraseMatches(input: string): boolean {
  const expected = Buffer.from(secret());
  const given = Buffer.from(input ?? '');
  if (expected.length !== given.length) return false;
  return timingSafeEqual(expected, given);
}

export function issueSessionCookie() {
  const issuedAt = Date.now().toString();
  const token = `${issuedAt}.${sign(issuedAt)}`;
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  };
}

export async function isAuthed(): Promise<boolean> {
  const c = await cookies();
  const token = c.get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [issuedAt, sig] = token.split('.');
  if (!issuedAt || !sig) return false;
  const expected = sign(issuedAt);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  if (!timingSafeEqual(a, b)) return false;
  const age = (Date.now() - Number(issuedAt)) / 1000;
  if (!Number.isFinite(age) || age < 0 || age > MAX_AGE_SECONDS) return false;
  return true;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
