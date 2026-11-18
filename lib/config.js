// Configuration serveur uniquement.
import { db } from './supabase';

export const SITE = {
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
  // Dates par défaut (variables OPEN_AT / CLOSE_AT). Elles sont remplacées par celles réglées dans l'administration (page « Calendrier »).
  open: Date.parse(process.env.OPEN_AT || '2026-11-20T00:00:00Z'),
  close: Date.parse(process.env.CLOSE_AT || '2026-12-21T00:00:00Z'),
};
export const phaseAt = (t, w = SITE) => (t < w.open ? 'waiting' : t >= w.close ? 'closed' : 'open');

let cache = null;
export const resetWindowCache = () => { cache = null; };

// Lit les dates d'ouverture et de fermeture enregistrées dans la base (table settings).
export async function getWindow(force = false) {
  if (!force && cache && Date.now() - cache.at < 5000) return cache.w;
  let w = { open: SITE.open, close: SITE.close };
  try {
    const { data } = await db().from('settings').select('key,value').in('key', ['open_at', 'close_at']);
    for (const r of data || []) {
      const t = Date.parse(r.value);
      if (!Number.isFinite(t)) continue;
      if (r.key === 'open_at') w.open = t;
      if (r.key === 'close_at') w.close = t;
    }
    if (w.close <= w.open) w = { open: SITE.open, close: SITE.close };
  } catch {}
  cache = { at: Date.now(), w };
  return w;
}
