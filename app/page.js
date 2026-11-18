import Landing from '@/components/Landing';
import { db } from '@/lib/supabase';
import { SITE } from '@/lib/config';
export const dynamic = 'force-dynamic';

async function stats() {
  try { const { data } = await db().rpc('public_stats'); return data || { children: 0, sponsors: 0, recent: [] }; }
  catch { return { children: 0, sponsors: 0, recent: [] }; }
}
export default async function Page() {
  return <Landing initial={await stats()} serverNow={Date.now()} open={SITE.open} close={SITE.close} turnstileKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''} />;
}
