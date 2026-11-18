import { redirect } from 'next/navigation';
import { db } from '@/lib/supabase';
import { adminBase, currentAdmin, endSession } from '@/lib/auth';
import { METHODS, PRICE, fmt } from '@/lib/pricing';
export const dynamic = 'force-dynamic';
const LABEL = { validated: 'VALIDÉ', pending: 'EN ATTENTE', failed: 'ÉCHEC / NON PAYÉ' };
const COLOR = { validated: 'text-vert', pending: 'text-nuit', failed: 'text-brique' };

export default async function Admin() {
  const base = adminBase();
  const me = await currentAdmin();
  if (!me) redirect(`${base}/login`);
  async function logout() { 'use server'; endSession(); redirect(`${base}/login`); }

  const { data } = await db().from('pledges').select('*').order('created_at', { ascending: false }).limit(5000);
  const rows = data || [];
  const ok = rows.filter((p) => p.status === 'validated');
  const N = ok.reduce((s, p) => s + p.children, 0);
  const count = (s) => rows.filter((p) => p.status === s).length;

  return (
    <main className="mx-auto flex max-w-[1200px] flex-col px-4 py-4 lg:h-[100dvh]">
      {/* PARTIE FIXE */}
      <div className="shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-extrabold">Tableau de bord</h1>
            <p className="text-sm">Connecté : {me}</p>
          </div>
          <div className="flex gap-3">
            <a className="btn btn-sun !min-h-[44px] !px-5 !text-base" href={`${base}/export`}>Exporter en Excel (.xlsx)</a>
            <form action={logout}><button className="btn btn-ghost !min-h-[44px] !px-5 !text-base">Déconnexion</button></form>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="card !p-3"><p className="text-sm">Enfants parrainés</p><p className="text-2xl font-extrabold">{fmt(N)}</p></div>
          <div className="card !p-3"><p className="text-sm">Montant encaissé</p><p className="text-2xl font-extrabold">{fmt(N * PRICE.unit)} FCFA</p></div>
          <div className="card !p-3"><p className="text-sm">Paiements en attente</p><p className="text-2xl font-extrabold">{count('pending')}</p></div>
          <div className="card !p-3"><p className="text-sm">Échecs / non payés</p><p className="text-2xl font-extrabold">{count('failed')}</p></div>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div className="card !p-3 text-sm"><h2 className="font-extrabold">Budget par rubrique</h2>
            {PRICE.parts.map((p) => <p key={p.key} className="mt-1 flex justify-between"><span>{p.label}</span><b>{fmt(N * p.amount)} FCFA</b></p>)}</div>
          <div className="card !p-3 text-sm"><h2 className="font-extrabold">Par opérateur</h2>
            {METHODS.map((m) => { const x = ok.filter((p) => p.method === m.key); return <p key={m.key} className="mt-1 flex justify-between"><span>{m.label} ({x.length} paiement{x.length > 1 ? 's' : ''})</span><b>{fmt(x.reduce((s, p) => s + p.amount_paid, 0))} FCFA</b></p>; })}</div>
        </div>
        <h2 className="mt-3 text-lg font-extrabold">Souscriptions ({rows.length})</h2>
      </div>

      {/* PARTIE QUI DÉFILE (l'en-tête du tableau reste visible) */}
      <div className="mt-2 overflow-auto rounded-2xl bg-white lg:min-h-0 lg:flex-1">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr>{['Réf.', 'Date', 'Type', 'Nom', 'Téléphone', 'Enfants', 'Montant', 'Opérateur', 'Statut'].map((h) => <th key={h} className="sticky top-0 z-10 bg-sable p-3">{h}</th>)}</tr>
          </thead>
          <tbody>{rows.slice(0, 500).map((p) => (
            <tr key={p.id} className="border-t border-sable">
              <td className="p-3">{p.ref}</td>
              <td className="p-3">{new Date(p.created_at).toLocaleString('fr-FR', { timeZone: 'UTC' })}</td>
              <td className="p-3">{p.donor_type}</td>
              <td className="p-3">{p.donor_name}{p.anonymous ? ' (anonyme)' : ''}</td>
              <td className="p-3">{p.phone}</td>
              <td className="p-3">{p.children}</td>
              <td className="p-3">{fmt(p.amount_expected)}</td>
              <td className="p-3">{METHODS.find((m) => m.key === p.method)?.label}</td>
              <td className={`p-3 font-bold ${COLOR[p.status]}`}>{LABEL[p.status]}{p.fail_reason ? ` (${p.fail_reason})` : ''}</td>
            </tr>))}</tbody>
        </table>
        {rows.length === 0 && <p className="p-6">Aucune souscription pour le moment.</p>}
      </div>
    </main>
  );
}
