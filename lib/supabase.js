import { createClient } from '@supabase/supabase-js';

// Next.js met en cache les requêtes GET faites avec fetch. Sans « no-store », les pages pouvaient relire
// une ancienne copie des données (dates du calendrier, liste des parrainages…) au lieu de celles de la base.
const noStore = (url, options = {}) => fetch(url, { ...options, cache: 'no-store' });

export function db() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Supabase non configuré');
  return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false }, global: { fetch: noStore } });
}
