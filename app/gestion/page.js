import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/supabase';
import { adminBase, currentAdmin, endSession } from '@/lib/auth';
import { audit } from '@/lib/security';
import { METHODS, PRICE, fmt } from '@/lib/pricing';
import AinaLogo from '@/components/AinaLogo';
import RowActions, { AccessRequest, Flash } from '@/components/AdminActions';
import AutoRefresh from '@/components/AutoRefresh';
export const dynamic = 'force-dynamic';

const LABEL = { validated: 'VALIDÉ', pending: 'EN ATTENTE', failed: 'ÉCHEC' };
const BADGE = { validated: 'bg-emerald-100 text-emerald-800', pending: 'bg-amber-100 text-amber-800', failed: 'bg-red-100 text-red-700' };
const REASON = { annule_admin: 'annulé par l’admin', montant_different: 'montant différent' };
const FILTERS = [['all', 'Tous'], ['pending', 'En attente'], ['validated', 'Validés'], ['failed', 'Échecs']];
const paid = (p) => p.amount_paid ?? p.amount_expected;
const back = (base, f, q = {}) => {
  const u = new URLSearchParams();
  if (['pending', 'validated', 'failed'].includes(f)) u.set('f', f);
  Object.entries(q).forEach(([k, v]) => u.set(k, String(v)));
  if (Object.keys(q).length) u.set('t', String(Date.now())); // rend chaque message unique
  const qs = u.toString();
  return qs ? `${base}?${qs}` : base;
};
const methodOf = (key) => METHODS.find((m) => m.key === key) || { key, label: 'Autre', color: '#9CA3AF' };

export default async function Admin({ searchParams }) {
  const base = adminBase();
  const me = await currentAdmin();
  if (!me) redirect(`${base}/login`);
  async function logout() { 'use server'; endSession(); redirect(`${base}/login`); }

  // Valider : l'admin confirme avoir reçu le paiement d'un parrainage « en attente ».
  // Le parrainage passe en « validé » (montant encaissé, date de paiement, vérifié) : il est donc
  // ajouté aux totaux du tableau de bord, au compteur public et à l'export Excel.
  async function validate(fd) {
    'use server';
    const who = await currentAdmin();
    if (!who) redirect(`${base}/login`);
    let q;
    try {
      const id = String(fd.get('id') || '');
      const { data: cur, error: e1 } = await db().from('pledges').select('status,amount_expected').eq('id', id).maybeSingle();
      if (e1) throw e1;
      if (!cur) q = { m: 'none' };
      else if (cur.status !== 'pending') q = { m: 'already' };
      else {
        const { data: p, error: e2 } = await db().from('pledges')
          .update({ status: 'validated', amount_paid: cur.amount_expected, verified: true, fail_reason: null, paid_at: new Date().toISOString() })
          .eq('id', id).eq('status', 'pending').select('ref,children,amount_expected').maybeSingle();
        if (e2) throw e2;
        if (p) { await audit(who, 'pledge_validated_admin', p.ref); q = { m: 'ok', ref: p.ref, k: p.children, a: p.amount_expected }; }
        else q = { m: 'already' };
      }
    } catch (e) { console.error('validate', e); q = { m: 'err', d: String(e?.message || e).slice(0, 160) }; }
    revalidatePath('/admin'); revalidatePath('/gestion');
    redirect(back(base, String(fd.get('f') || ''), q));
  }
  // Vérifier : contrôle a posteriori d'un paiement déjà validé automatiquement.
  async function verify(fd) {
    'use server';
    const who = await currentAdmin();
    if (!who) redirect(`${base}/login`);
    let q;
    try {
      const { data: p, error } = await db().from('pledges').update({ verified: true }).eq('id', String(fd.get('id') || '')).eq('status', 'validated').select('ref').maybeSingle();
      if (error) throw error;
      if (p) { await audit(who, 'pledge_verified', p.ref); q = { m: 'vok', ref: p.ref }; } else q = { m: 'already' };
    } catch (e) { console.error('verify', e); q = { m: 'err', d: String(e?.message || e).slice(0, 160) }; }
    revalidatePath('/admin'); revalidatePath('/gestion');
    redirect(back(base, String(fd.get('f') || ''), q));
  }

  // Demandes d'accès : un administrateur approuve ou refuse les comptes créés depuis /admin/inscription.
  async function approve(fd) {
    'use server';
    const who = await currentAdmin();
    if (!who) redirect(`${base}/login`);
    let q;
    try {
      const { data: u, error } = await db().from('admin_users').update({ approved: true }).eq('email', String(fd.get('email') || '').toLowerCase()).eq('approved', false).select('email').maybeSingle();
      if (error) throw error;
      if (u) { await audit(who, 'admin_approved', u.email); q = { m: 'aok', ref: u.email }; } else q = { m: 'already' };
    } catch (e) { console.error('approve', e); q = { m: 'err', d: String(e?.message || e).slice(0, 160) }; }
    redirect(back(base, String(fd.get('f') || ''), q));
  }
  async function refuse(fd) {
    'use server';
    const who = await currentAdmin();
    if (!who) redirect(`${base}/login`);
    let q;
    try {
      const { data: u, error } = await db().from('admin_users').delete().eq('email', String(fd.get('email') || '').toLowerCase()).eq('approved', false).select('email').maybeSingle();
      if (error) throw error;
      if (u) { await audit(who, 'admin_refused', u.email); q = { m: 'aref', ref: u.email }; } else q = { m: 'already' };
    } catch (e) { console.error('refuse', e); q = { m: 'err', d: String(e?.message || e).slice(0, 160) }; }
    redirect(back(base, String(fd.get('f') || ''), q));
  }

  const { data: reqData } = await db().from('admin_users').select('email,created_at').eq('approved', false).order('created_at', { ascending: true });
  const reqs = reqData || [];
  const { data } = await db().from('pledges').select('*').order('created_at', { ascending: false }).limit(5000);
  const rows = data || [];
  const ok = rows.filter((p) => p.status === 'validated');
  const pend = rows.filter((p) => p.status === 'pending');
  const N = ok.reduce((s, p) => s + p.children, 0);
  const verifiedSum = ok.filter((p) => p.verified).reduce((s, p) => s + paid(p), 0);
  const unverified = ok.filter((p) => !p.verified).length;
  const failed = rows.filter((p) => p.status === 'failed').length;
  const pendKids = pend.reduce((s, p) => s + p.children, 0);

  const f = ['pending', 'validated', 'failed'].includes(searchParams?.f) ? searchParams.f : 'all';
  const counts = { all: rows.length, pending: pend.length, validated: ok.length, failed };
  const view = (f === 'all' ? rows : rows.filter((p) => p.status === f)).slice(0, 500);

  // Par opérateur : Orange Money et Moov Money uniquement.
  const keys = METHODS.map((m) => m.key);

  const sp = searchParams || {};
  const flash = {
    ok: ['ok', `✓ Parrainage ${sp.ref} validé : ${fmt(Number(sp.k) || 0)} enfant${Number(sp.k) > 1 ? 's' : ''} · ${fmt(Number(sp.a) || 0)} FCFA ajoutés au tableau de bord.`],
    vok: ['ok', `✓ Paiement ${sp.ref} marqué vérifié.`],
    aok: ['ok', `✓ Compte ${sp.ref} approuvé : cette personne peut maintenant se connecter.`],
    aref: ['warn', `Demande de ${sp.ref} refusée et supprimée.`],
    already: ['warn', 'Cet élément n’est plus en attente : il a déjà été traité.'],
    none: ['err', 'Parrainage introuvable.'],
    err: ['err', `L’opération a échoué : ${String(sp.d || 'erreur inconnue').slice(0, 160)}`],
  }[sp.m];

  const date = (p) => new Date(p.created_at).toLocaleString('fr-FR', { timeZone: 'UTC' });
  const actions = (p) => <RowActions id={p.id} name={p.donor_name} status={p.status} verified={!!p.verified} kids={p.children} amount={p.amount_expected} filter={f} onValidate={validate} onVerify={verify} />;
  const status = (p) => (<><span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${BADGE[p.status]}`}>{LABEL[p.status]}</span>{p.fail_reason ? <span className="a-muted mt-0.5 block text-[11px]">{REASON[p.fail_reason] || p.fail_reason}</span> : null}</>);

  return (
    <main className="mx-auto flex max-w-[1240px] flex-col overflow-x-hidden px-4 py-2 md:h-[100dvh]">
      <AutoRefresh seconds={5} />
      <div className="shrink-0">
        <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <AinaLogo className="shrink-0 whitespace-nowrap text-[46px] sm:text-[54px]" />
            <div className="min-w-0 sm:border-l-2 sm:border-sable sm:pl-4">
              <h1 className="text-xl font-bold tracking-tight">Tableau de bord</h1>
              <p className="a-muted text-sm">Connecté : {me}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <a className="btn btn-ghost !min-h-[42px] !px-5 !text-[15px]" href={`${base}/calendrier`}>Calendrier</a>
            <a className="btn btn-sun !min-h-[42px] !px-5 !text-[15px]" href={`${base}/export`}>Exporter en Excel (.xlsx)</a>
            <form action={logout}><button className="btn btn-ghost !min-h-[42px] !px-5 !text-[15px]">Déconnexion</button></form>
          </div>
        </header>

        {flash && <Flash key={sp.t || sp.m} kind={flash[0]} text={flash[1]} />}

        {reqs.length > 0 && (
          <section className="mt-2 rounded-2xl border border-amber-300 bg-amber-50 p-3" aria-label="Demandes d’accès">
            <h2 className="text-sm font-bold">Demandes d’accès à l’administration ({reqs.length})</h2>
            <ul className="mt-2 divide-y divide-amber-200">
              {reqs.map((r) => (
                <li key={r.email} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0">
                  <span className="min-w-0 break-all"><b>{r.email}</b> {r.created_at && <span className="a-muted text-xs">· demandé le {new Date(r.created_at).toLocaleDateString('fr-FR', { timeZone: 'UTC' })}</span>}</span>
                  <AccessRequest email={r.email} filter={f} onApprove={approve} onRefuse={refuse} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-2 grid grid-cols-2 gap-2 lg:grid-cols-5">
          <div className="card !px-3 !py-2"><p className="a-muted text-[11px] font-semibold uppercase tracking-wide">Enfants parrainés</p><p className="text-xl font-bold tabular-nums text-brique">{fmt(N)}</p></div>
          <div className="card !px-3 !py-2"><p className="a-muted text-[11px] font-semibold uppercase tracking-wide">Montant encaissé</p><p className="text-xl font-bold tabular-nums">{fmt(N * PRICE.unit)} <span className="text-sm">FCFA</span></p><p className="a-muted text-[11px] leading-tight">dont {fmt(verifiedSum)} FCFA vérifiés</p></div>
          <div className={`card !px-3 !py-2 ${pend.length ? '!border-amber-300 !bg-amber-50' : ''}`}><p className="a-muted text-[11px] font-semibold uppercase tracking-wide">En attente</p><p className="text-xl font-bold tabular-nums">{pend.length}</p><p className="a-muted text-[11px] leading-tight">{pend.length ? `${fmt(pendKids)} enfant${pendKids > 1 ? 's' : ''} · ${fmt(pendKids * PRICE.unit)} FCFA à valider` : 'rien à valider'}</p></div>
          <div className="card !px-3 !py-2"><p className="a-muted text-[11px] font-semibold uppercase tracking-wide">Non vérifiés</p><p className="text-xl font-bold tabular-nums">{unverified}</p><p className="a-muted text-[11px] leading-tight">paiements validés</p></div>
          <div className="card col-span-2 !px-3 !py-2 lg:col-span-1"><p className="a-muted text-[11px] font-semibold uppercase tracking-wide">Échecs / annulés</p><p className="text-xl font-bold tabular-nums">{failed}</p></div>
        </div>

        <div className="mt-2 grid gap-2 md:grid-cols-2">
          <div className="card !px-3 !py-2"><h2 className="text-[11px] font-bold uppercase tracking-wide">Budget par rubrique</h2>
            <div className="mt-1 grid gap-1 sm:grid-cols-3 sm:gap-3">{PRICE.parts.map((p) => <div key={p.key} className="flex items-baseline justify-between gap-3 sm:block"><p className="a-muted text-[11px] leading-tight">{p.label}</p><p className="whitespace-nowrap text-sm font-bold tabular-nums">{fmt(N * p.amount)} FCFA</p></div>)}</div></div>
          <div className="card !px-3 !py-2"><h2 className="text-[11px] font-bold uppercase tracking-wide">Par opérateur</h2>
            <div className="mt-1 grid gap-1 sm:grid-cols-2 sm:gap-3">{keys.map((k) => { const m = methodOf(k); const x = ok.filter((p) => p.method === k); return <div key={k} className="flex items-baseline justify-between gap-3 sm:block"><p className="a-muted flex items-center gap-1.5 text-[11px] leading-tight"><span className="h-2 w-2 rounded-full" style={{ background: m.color }} />{m.label} ({x.length} paiement{x.length > 1 ? 's' : ''})</p><p className="whitespace-nowrap text-sm font-bold tabular-nums">{fmt(x.reduce((s, p) => s + paid(p), 0))} FCFA</p></div>; })}</div></div>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold">Souscriptions ({rows.length})</h2>
          <nav className="flex flex-wrap gap-1.5" aria-label="Filtrer">
            {FILTERS.map(([k, l]) => (
              <a key={k} href={k === 'all' ? base : `${base}?f=${k}`} className={`rounded-full px-3 py-1 text-xs font-bold ${f === k ? 'bg-nuit text-white' : 'bg-white text-nuit shadow-[inset_0_0_0_1.5px_#17583B]'}`}>{l} ({counts[k]})</a>
            ))}
          </nav>
        </div>
      </div>

      <div className="mt-2 overflow-x-hidden rounded-2xl border border-sable bg-white md:min-h-0 md:flex-1 md:overflow-y-auto">
        <table className="hidden w-full table-fixed text-left text-sm md:table">
          <colgroup><col style={{ width: '19%' }} /><col style={{ width: '23%' }} /><col style={{ width: '8%' }} /><col style={{ width: '12%' }} /><col style={{ width: '13%' }} /><col style={{ width: '12%' }} /><col style={{ width: '13%' }} /></colgroup>
          <thead>
            <tr>{['Souscription', 'Donateur', 'Enfants', 'Montant', 'Opérateur', 'Statut', 'Contrôle'].map((h) => <th key={h} className="sticky top-0 z-10 bg-sable px-3 py-2.5 text-[11px] font-bold uppercase tracking-wide">{h}</th>)}</tr>
          </thead>
          <tbody>{view.map((p, i) => { const m = methodOf(p.method); return (
            <tr key={p.id} className={`border-t border-sable align-middle ${p.status === 'pending' ? 'bg-amber-50/70' : i % 2 ? 'bg-creme/50' : ''}`}>
              <td className="px-3 py-2.5"><div className="break-all font-mono text-[11px] font-semibold">{p.ref}</div><div className="a-muted text-xs">{date(p)}</div></td>
              <td className="px-3 py-2.5"><div className="break-words font-semibold">{p.donor_name}{p.anonymous ? ' (anonyme)' : ''}</div><div className="a-muted text-xs"><span className="capitalize">{p.donor_type}</span> · {p.phone}</div></td>
              <td className="px-3 py-2.5 font-semibold tabular-nums">{p.children}</td>
              <td className="px-3 py-2.5 font-semibold tabular-nums">{fmt(p.amount_expected)}<span className="a-muted block text-[11px] font-normal">FCFA</span></td>
              <td className="px-3 py-2.5"><span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: m.color }} />{m.label}</span></td>
              <td className="px-3 py-2.5">{status(p)}</td>
              <td className="px-3 py-2.5">{actions(p)}</td>
            </tr>); })}</tbody>
        </table>

        <ul className="divide-y divide-sable md:hidden">
          {view.map((p) => { const m = methodOf(p.method); return (
            <li key={p.id} className={`p-3 ${p.status === 'pending' ? 'bg-amber-50/70' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="break-words font-semibold">{p.donor_name}{p.anonymous ? ' (anonyme)' : ''}</p><p className="a-muted text-xs"><span className="capitalize">{p.donor_type}</span> · {p.phone}</p></div>
                <div className="shrink-0 text-right">{status(p)}</div>
              </div>
              <p className="a-muted mt-1 break-all text-[11px]"><span className="font-mono font-semibold">{p.ref}</span> · {date(p)}</p>
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-sm"><b className="tabular-nums">{p.children}</b> enfant{p.children > 1 ? 's' : ''} · <b className="tabular-nums">{fmt(p.amount_expected)}</b> FCFA · <span className="whitespace-nowrap"><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: m.color }} />{m.label}</span></p>
                <div className="shrink-0">{actions(p)}</div>
              </div>
            </li>); })}
        </ul>
        {view.length === 0 && <p className="p-6">{rows.length === 0 ? 'Aucune souscription pour le moment.' : 'Aucune souscription dans ce filtre.'}</p>}
      </div>
    </main>
  );
}
