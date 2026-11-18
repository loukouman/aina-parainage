import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { METHODS } from '@/lib/pricing';
import { COOKIE_NAME, makeToken } from '@/lib/sponsor';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  if (!/^AINA-[A-Z2-9]{10}$/.test(params.ref)) return NextResponse.json({ status: 'unknown' }, { status: 404 });
  const { data: p } = await db().from('pledges').select('*').eq('ref', params.ref).maybeSingle();
  if (!p) return NextResponse.json({ status: 'unknown' }, { status: 404 });
  if (p.status !== 'validated') return NextResponse.json({ status: p.status });
  const { data: stats } = await db().rpc('public_stats');
  const res = NextResponse.json({
    status: 'validated', stats: stats || null,
    receipt: {
      ref: p.ref, name: p.donor_name, type: p.donor_type, children: p.children, amount: p.amount_paid,
      method: METHODS.find((m) => m.key === p.method)?.label, paidAt: p.paid_at, tx: p.provider_tx_id,
      phone: p.phone.slice(0, 4) + ' •• •• •• ' + p.phone.slice(-2),
    },
  });
  // Le donateur devient « parrain » : il peut maintenant voir le compteur public.
  res.cookies.set(COOKIE_NAME, makeToken(), { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 60 * 60 * 24 * 365 });
  return res;
}
