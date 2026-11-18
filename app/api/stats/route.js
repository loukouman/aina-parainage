import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase';
export const dynamic = 'force-dynamic';
export async function GET() {
  try {
    const { data, error } = await db().rpc('public_stats');
    if (error) throw error;
    return NextResponse.json(data, { headers: { 'Cache-Control': 'public, s-maxage=4, stale-while-revalidate=10' } });
  } catch { return NextResponse.json({ children: 0, sponsors: 0, recent: [] }, { status: 503 }); }
}
