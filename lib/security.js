import crypto from 'crypto';
import { db } from './supabase';

export const clientIp = (h) => (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || '0.0.0.0';
export const hashKey = (v) => crypto.createHmac('sha256', process.env.APP_SECRET || 'x').update(String(v)).digest('hex').slice(0, 32);

export function hmacValid(raw, signature, secret) {
  if (!secret || !signature) return false;
  const exp = Buffer.from(crypto.createHmac('sha256', secret).update(raw).digest('hex'));
  const got = Buffer.from(String(signature).replace(/^sha256=/, '').toLowerCase());
  return exp.length === got.length && crypto.timingSafeEqual(exp, got);
}

export function ipAllowed(ip) {
  const list = (process.env.PAYMENT_IP_WHITELIST || '').split(',').map((s) => s.trim()).filter(Boolean);
  if (list.length) return list.includes(ip);
  return process.env.PAYMENT_PROVIDER === 'sandbox'; // hors sandbox : liste obligatoire (échec fermé)
}

export async function turnstileOk(token, ip) {
  const secret = process.env.TURNSTILE_SECRET;
  if (!secret) return process.env.NODE_ENV !== 'production';
  if (!token) return false;
  try {
    const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token, remoteip: ip }),
    });
    return (await r.json()).success === true;
  } catch { return false; }
}

// Limitation de débit stockée en base (fiable même sans mémoire partagée).
export async function limited(key, max = 6, windowMin = 10) {
  const since = new Date(Date.now() - windowMin * 60000).toISOString();
  const { count } = await db().from('attempts').select('*', { count: 'exact', head: true }).eq('k', key).gte('at', since);
  if ((count || 0) >= max) return true;
  await db().from('attempts').insert({ k: key });
  return false;
}

export async function audit(actor, action, ref = null, details = {}) {
  try { await db().from('audit_log').insert({ actor, action, ref, details }); } catch (e) { console.error('audit', e); }
}
