'use client';
import { useEffect, useState } from 'react';
import { PRICE, fmt } from '@/lib/pricing';
import Garland from './Garland';

export default function Receipt({ reference }) {
  const [d, setD] = useState({ status: 'pending' });
  useEffect(() => {
    let tries = 0, stop = false;
    // La validation est faite à la main par l'organisation : on vérifie souvent au début, puis plus rarement.
    const tick = async () => {
      try { const r = await fetch(`/api/pledge/${reference}/status`, { cache: 'no-store' }); const j = await r.json(); if (!stop) setD(j); if (j.status !== 'pending') return; } catch {}
      if (++tries < 400 && !stop) setTimeout(tick, tries < 40 ? 8000 : 30000);
    };
    tick(); return () => { stop = true; };
  }, [reference]);

  const r = d.receipt;
  return (
    <main className="mx-auto max-w-xl px-4 py-8">
      <div className="-mx-4 -mt-8 mb-4 print:hidden"><Garland /></div>
      <p className="mb-4 text-center text-2xl font-extrabold text-brique print:hidden">AÏNA</p>
      {d.status === 'pending' && (
        <div className="card text-center" role="status">
          <h1 className="text-2xl font-extrabold">Merci ! Votre parrainage est enregistré</h1>
          <p className="mt-2">Nous vérifions la réception de votre paiement. Votre reçu s’affichera ici dès sa validation.</p>
          <p className="mt-3 rounded-xl bg-sable p-3 text-sm font-bold">Conservez cette page ou notez votre référence : <b>{reference}</b></p>
          <p className="mt-3 text-sm">Cette page se met à jour automatiquement.</p>
        </div>
      )}
      {d.status === 'failed' && (
        <div className="card text-center">
          <h1 className="text-2xl font-extrabold">Paiement non confirmé</h1>
          <p className="mt-2">Nous n’avons pas pu confirmer votre paiement. Si vous avez bien payé, contactez l’organisation en indiquant votre référence : <b>{reference}</b>.</p>
          <a href="/" className="btn mt-5">Retour à l’accueil</a>
        </div>
      )}
      {d.status === 'unknown' && <div className="card text-center"><h1 className="text-2xl font-extrabold">Reçu introuvable</h1><p className="mt-2">Vérifiez l’adresse de cette page.</p><a href="/" className="btn mt-5">Retour à l’accueil</a></div>}
      {r && (<>
        <div className="card">
          <h1 className="text-2xl font-extrabold">Merci, parrainage validé !</h1>
          <p className="mt-1">Reçu n° <b>{r.ref}</b> · {new Date(r.paidAt).toLocaleString('fr-FR', { timeZone: 'UTC' })} (GMT)</p>
          <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
            <dt className="font-bold">Parrain</dt><dd>{r.name}</dd>
            <dt className="font-bold">Téléphone</dt><dd>{r.phone}</dd>
            <dt className="font-bold">Enfants parrainés</dt><dd>{r.children}</dd>
            <dt className="font-bold">Moyen de paiement</dt><dd>{r.method}</dd>
            {r.tx && !String(r.tx).startsWith('DECL-') && <><dt className="font-bold">Transaction</dt><dd className="break-all">{r.tx}</dd></>}
          </dl>
          <table className="mt-5 w-full text-left"><tbody>
            {PRICE.parts.map((p) => <tr key={p.key} className="border-t border-sable"><td className="py-2">{p.label}</td><td className="py-2 text-right">{fmt(p.amount * r.children)} FCFA</td></tr>)}
            <tr className="border-t-2 border-nuit font-extrabold"><td className="py-2">Total payé</td><td className="py-2 text-right">{fmt(r.amount)} FCFA</td></tr>
          </tbody></table>
          <div className="mt-6 flex flex-col gap-3 print:hidden">
            <button className="btn btn-ghost" onClick={() => window.print()}>Télécharger / imprimer le reçu</button>
            <a className="btn btn-wa" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent('J’ai parrainé ' + r.children + ' enfant(s) pour « Ma Fête à Karpala ». Rejoignez-moi : ' + window.location.origin)}`}>Partager sur WhatsApp</a>
          </div>
        </div>
        {d.stats && (
          <div className="card mt-5 bg-sable text-center print:hidden">
            <p className="font-extrabold">Vous faites partie des parrains !</p>
            <div className="text-6xl font-extrabold tabular-nums text-brique">{fmt(d.stats.children)}</div>
            <p>enfants parrainés à ce jour, grâce à {fmt(d.stats.sponsors)} parrain{d.stats.sponsors > 1 ? 's' : ''}.</p>
            <a href="/" className="btn mt-4">Retour à l’accueil</a>
          </div>
        )}
      </>)}
    </main>
  );
}
