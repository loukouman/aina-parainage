import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase';
import { adminBase, currentAdmin } from '@/lib/auth';
import { audit } from '@/lib/security';
import { getWindow, phaseAt, resetWindowCache } from '@/lib/config';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Calendrier – Administration', robots: { index: false, follow: false } };

const iso = (ms) => new Date(ms).toISOString().slice(0, 19); // AAAA-MM-JJThh:mm:ss
const LABEL = { waiting: 'Avant l’ouverture', open: 'Parrainages ouverts', closed: 'Parrainages clos' };

export default async function Calendrier({ searchParams }) {
  const base = adminBase();
  const me = await currentAdmin();
  if (!me) redirect(`${base}/login`);
  const w = await getWindow(true);

  async function save(fd) {
    'use server';
    const who = await currentAdmin();
    if (!who) redirect(`${base}/login`);
    const open = Date.parse(String(fd.get('open')) + 'Z');   // heure du Burkina Faso = GMT
    const last = Date.parse(String(fd.get('close')) + 'Z');
    if (!Number.isFinite(open) || !Number.isFinite(last) || last <= open) redirect(`${base}/calendrier?e=1`);
    const close = last + 1000; // la fermeture est effective juste après la dernière seconde choisie
    const { error } = await db().from('settings').upsert([
      { key: 'open_at', value: new Date(open).toISOString() },
      { key: 'close_at', value: new Date(close).toISOString() },
    ]);
    if (error) redirect(`${base}/calendrier?e=2`);
    await audit(who, 'settings_calendar', null, { open: new Date(open).toISOString(), close: new Date(close).toISOString() });
    resetWindowCache();
    redirect(`${base}/calendrier?ok=1`);
  }

  const e = searchParams?.e;
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <a href={base} className="text-sm font-bold underline">← Retour au tableau de bord</a>
      <h1 className="mt-3 text-3xl font-extrabold">Calendrier de la campagne</h1>
      <p className="mt-2">Situation actuelle : <b>{LABEL[phaseAt(Date.now(), w)]}</b></p>
      <form action={save} className="card mt-5">
        {searchParams?.ok && <p role="status" className="mb-4 rounded-xl bg-sable p-3 text-sm font-bold">Dates enregistrées. Le site les applique immédiatement.</p>}
        {e && <p role="alert" className="mb-4 rounded-xl bg-sable p-3 text-sm font-bold">{e === '1' ? 'Dates invalides : la fermeture doit être après l’ouverture.' : 'Enregistrement impossible. Vérifiez que la table « settings » existe dans la base.'}</p>}
        <label className="block text-sm font-extrabold">Ouverture des parrainages
          <input className="field" type="datetime-local" step="1" name="open" required defaultValue={iso(w.open)} /></label>
        <label className="mt-4 block text-sm font-extrabold">Fermeture (dernière seconde où l’on peut parrainer)
          <input className="field" type="datetime-local" step="1" name="close" required defaultValue={iso(w.close - 1000)} /></label>
        <p className="mt-3 text-sm">Heures du Burkina Faso (GMT). Avant l’ouverture, le site affiche le compte à rebours ; après la fermeture, il affiche le bilan.</p>
        <button className="btn mt-5 w-full">Enregistrer les dates</button>
      </form>
    </main>
  );
}
