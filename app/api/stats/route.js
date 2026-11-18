import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/supabase';
import { getWindow, phaseAt } from '@/lib/config';
import { COOKIE_NAME, validToken } from '@/lib/sponsor';
export const dynamic = 'force-dynamic';

export async function GET() {
  const allowed = phaseAt(Date.now(), await getWindow()) === 'closed' || validToken(cookies().get(COOKIE_NAME)?.value);
  if (!allowed) return NextResponse.json({ hidden: true }, { status: 403, headers: { 'Cache-Control': 'private, no-store' } });
  try {
    const { data, error } = await db().rpc('public_stats');
    if (error) throw error;
    return NextResponse.json(data, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch { return NextResponse.json({ children: 0, sponsors: 0, recent: [] }, { status: 503 }); }
}
