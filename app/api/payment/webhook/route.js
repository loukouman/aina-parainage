import { NextResponse } from 'next/server';
import { parseWebhook } from '@/lib/payment';
import { processPaymentEvent } from '@/lib/process';
import { audit, clientIp, ipAllowed } from '@/lib/security';

export async function POST(req) {
  const ip = clientIp(req.headers);
  if (!ipAllowed(ip)) { await audit('webhook', 'webhook_ip_refused', null, { ip }); return NextResponse.json({ error: 'refused' }, { status: 403 }); }
  const raw = await req.text();
  let ev;
  try { ev = await parseWebhook(raw, req.headers); }
  catch { await audit('webhook', 'webhook_signature_refused', null, { ip }); return NextResponse.json({ error: 'refused' }, { status: 401 }); }
  try { const result = await processPaymentEvent(ev); return NextResponse.json({ ok: true, result }); }
  catch (e) { console.error(e); return NextResponse.json({ error: 'retry' }, { status: 500 }); } // l'opérateur renverra la notification
}
