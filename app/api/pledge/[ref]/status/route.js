import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
import { METHODS } from '@/lib/pricing';
export const dynamic = 'force-dynamic';

export async function GET(_req, { params }) {
  if (!/^AINA-[A-Z2-9]{10}$/.test(params.ref)) return NextResponse.json({ status: 'unknown' }, { status: 404 });
  const { data: p } = await db().from('pledges').select('*').eq('ref', params.ref).maybeSingle();
  if (!p) return NextResponse.json({ status: 'unknown' }, { status: 404 });
  if (p.status !== 'validated') return NextResponse.json({ status: p.status });
  return NextResponse.json({ status: 'validated', receipt: {
    ref: p.ref, name: p.donor_name, type: p.donor_type, children: p.children, amount: p.amount_paid,
    method: METHODS.find((m) => m.key === p.method)?.label, paidAt: p.paid_at, tx: p.provider_tx_id,
    phone: p.phone.slice(0, 4) + ' •• •• •• ' + p.phone.slice(-2),
  } });
}
