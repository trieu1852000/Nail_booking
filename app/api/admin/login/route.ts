import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, SESSION_MAX_AGE, createSessionToken, safeEqual } from '@/lib/admin-auth';

export async function POST(request: Request) {
  const { email, password } = await request.json().catch(() => ({}));

  const okEmail = safeEqual(String(email || ''), process.env.ADMIN_EMAIL || '');
  const okPass = safeEqual(String(password || ''), process.env.ADMIN_PASSWORD || '');

  if (!process.env.ADMIN_PASSWORD || !okEmail || !okPass) {
    return NextResponse.json({ error: 'Sai email hoặc mật khẩu.' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(ADMIN_COOKIE, createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return res;
}