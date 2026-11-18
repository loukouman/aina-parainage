import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
const key = () => new TextEncoder().encode(process.env.APP_SECRET);
const COOKIE = 'aina_admin';

export const adminBase = () => '/admin';
export const gateOk = () => !!process.env.APP_SECRET && headers().get('x-admin-gate') === process.env.APP_SECRET;

export async function startSession(email) {
  const t = await new SignJWT({ email }).setProtectedHeader({ alg: 'HS256' }).setIssuedAt().setExpirationTime('2h').sign(key());
  cookies().set(COOKIE, t, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'strict', path: '/', maxAge: 7200 });
}
export function endSession() { cookies().delete(COOKIE); }
export async function currentAdmin() {
  const t = cookies().get(COOKIE)?.value;
  if (!t) return null;
  try { return (await jwtVerify(t, key())).payload.email; } catch { return null; }
}
