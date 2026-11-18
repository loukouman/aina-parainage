import { cookies } from 'next/headers';
import Landing from '@/components/Landing';
import { db } from '@/lib/supabase';
import { getWindow, phaseAt } from '@/lib/config';
import { COOKIE_NAME, validToken } from '@/lib/sponsor';
export const dynamic = 'force-dynamic';

async function stats() {
  try { const { data } = await db().rpc('public_stats'); return data || { children: 0, sponsors: 0, recent: [] }; }
  catch { return { children: 0, sponsors: 0, recent: [] }; }
}
export default async function Page() {
  const w = await getWindow();
  // Le compteur n'est visible qu'après un parrainage (ou une fois la campagne terminée).
  const allowed = phaseAt(Date.now(), w) === 'closed' || validToken(cookies().get(COOKIE_NAME)?.value);
  return <Landing initial={allowed ? await stats() : null} canSee={allowed} serverNow={Date.now()} open={w.open} close={w.close} turnstileKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''} />;
}
