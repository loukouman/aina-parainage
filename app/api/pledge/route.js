import crypto from 'crypto';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/supabase';
import { SITE, getWindow, phaseAt } from '@/lib/config';
import { MAX_CHILDREN, total } from '@/lib/pricing';
import { createCheckout } from '@/lib/payment';
import { audit, clientIp, hashKey, limited, turnstileOk } from '@/lib/security';

const Body = z.object({
  type: z.enum(['particulier', 'entreprise']),
  name: z.string().trim().min(2).max(120),
  contact: z.string().trim().max(120).optional().default(''),
  phone: z.string().max(30),
  children: z.number().int().min(1).max(MAX_CHILDREN),
  method: z.enum(['orange', 'moov', 'wave']),
  anonymous: z.boolean().default(false),
  turnstile: z.string().max(2048).optional(),
});
const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newRef = () => 'AINA-' + Array.from(crypto.randomBytes(10), (b) => A[b % A.length]).join('');
const err = (m, s) => NextResponse.json({ error: m }, { status: s });

export async function POST(req) {
  const origin = req.headers.get('origin');
  if (!origin || new URL(origin).origin !== new URL(SITE.url).origin) return err('Requête refusée.', 403);
  if (phaseAt(Date.now(), await getWindow()) !== 'open') return err("Les parrainages ne sont pas ouverts actuellement.", 403);
  let body;
  try { body = Body.parse(await req.json()); } catch { return err('Vérifiez les informations saisies.', 400); }

  const phone = body.phone.replace(/[\s.\-()]/g, '').replace(/^00226/, '+226').replace(/^226/, '+226').replace(/^(\d{8})$/, '+226$1');
  if (!/^\+226\d{8}$/.test(phone)) return err('Numéro invalide. Format : +226 XX XX XX XX', 400);

  const ip = clientIp(req.headers);
  const ipKey = hashKey(ip);
  try {
    if (await limited('pledge:' + ipKey)) return err('Trop de tentatives. Réessayez dans quelques minutes.', 429);
    if (!(await turnstileOk(body.turnstile, ip))) return err('Vérification anti-robot échouée. Rechargez la page.', 400);

    const ref = newRef();
    const amount = total(body.children); // recalculé côté serveur, jamais lu depuis le navigateur
    const { error } = await db().from('pledges').insert({
      ref, donor_type: body.type, donor_name: body.name, contact_name: body.type === 'entreprise' ? body.contact || null : null,
      phone, anonymous: body.anonymous, children: body.children, amount_expected: amount, method: body.method,
    });
    if (error) throw error;
    await audit('public', 'pledge_created', ref, { children: body.children, amount, method: body.method, ip: ipKey });
    try {
      const { url } = await createCheckout({ ref, amount, phone, method: body.method });
      await audit('public', 'payment_initiated', ref, {});
      return NextResponse.json({ ref, url });
    } catch (e) {
      console.error(e);
      await db().from('pledges').update({ status: 'failed', fail_reason: 'initiation_impossible' }).eq('ref', ref);
      await audit('system', 'payment_init_failed', ref, { message: String(e.message).slice(0, 200) });
      return err("Le paiement n'a pas pu démarrer. Réessayez.", 502);
    }
  } catch (e) { console.error(e); return err('Service indisponible. Réessayez dans un instant.', 500); }
}
