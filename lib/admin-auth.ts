import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { connection } from 'next/server';

export const ADMIN_COOKIE = 'admin_session';
export const SESSION_MAX_AGE = 60 * 60 * 12; // 12 hours

function sign(payload: string) {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET!)
    .update(payload)
    .digest('base64url');
}

export function createSessionToken() {
  const exp = String(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE);
  return `${exp}.${sign(exp)}`;
}

export function verifySessionToken(token?: string | null) {
  if (!token || !process.env.ADMIN_SESSION_SECRET) return false;
  const [exp, sig] = token.split('.');
  if (!exp || !sig) return false;

  const expected = Buffer.from(sign(exp));
  const actual = Buffer.from(sig);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return false;

  return Number(exp) > Math.floor(Date.now() / 1000);
}

export function safeEqual(a: string, b: string) {
  const ha = createHash('sha256').update(a).digest();
  const hb = createHash('sha256').update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function isAdmin() {
  await connection();
  const store = await cookies();
  return verifySessionToken(store.get(ADMIN_COOKIE)?.value);
}