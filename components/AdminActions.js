'use client';
import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { fmt } from '@/lib/pricing';

function Btn({ className, children }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className={`${className} disabled:opacity-60`}>{pending ? '…' : children}</button>;
}

// Colonne « Contrôle » :
//  - en attente  → « Valider » : l'admin confirme avoir reçu le paiement. Le parrainage est compté
//                  (enfants, montant, budget, opérateur) et marqué vérifié.
//  - validé non vérifié → « Vérifier » (paiement retrouvé dans le compte marchand)
//  - validé vérifié → « ✓ Vérifié »
export default function RowActions({ id, name, status, verified, kids, amount, filter, onValidate, onVerify }) {
  const ask = (m) => (e) => { if (!window.confirm(m)) e.preventDefault(); };
  if (status === 'pending') {
    return (
      <form action={onValidate} onSubmit={ask(`Confirmer le paiement de ${fmt(amount)} FCFA de ${name} ?\n\n${kids} enfant${kids > 1 ? 's' : ''} seront ajoutés au tableau de bord.`)}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="f" value={filter} />
        <Btn className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700">Valider</Btn>
      </form>
    );
  }
  if (status === 'validated') {
    if (verified) return <span className="text-xs font-bold text-emerald-700">✓ Vérifié</span>;
    return (
      <form action={onVerify} onSubmit={ask(`Marquer comme vérifié le paiement de ${name} ?`)}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="f" value={filter} />
        <Btn className="rounded-lg border border-emerald-600 px-3 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50">Vérifier</Btn>
      </form>
    );
  }
  return <span className="a-muted text-xs">—</span>;
}

// Demande d'accès à l'administration : approuver (la personne peut se connecter) ou refuser (demande supprimée).
export function AccessRequest({ email, filter, onApprove, onRefuse }) {
  const ask = (m) => (e) => { if (!window.confirm(m)) e.preventDefault(); };
  return (
    <span className="flex gap-2">
      <form action={onApprove} onSubmit={ask(`Autoriser ${email} à accéder à l’administration ?\n\nCette personne pourra voir les données des donateurs et valider des paiements.`)}>
        <input type="hidden" name="email" value={email} /><input type="hidden" name="f" value={filter} />
        <Btn className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700">Approuver</Btn>
      </form>
      <form action={onRefuse} onSubmit={ask(`Refuser la demande de ${email} ? Elle sera supprimée.`)}>
        <input type="hidden" name="email" value={email} /><input type="hidden" name="f" value={filter} />
        <Btn className="rounded-lg border border-red-500 px-3 py-1.5 text-xs font-bold text-red-700 hover:bg-red-50">Refuser</Btn>
      </form>
    </span>
  );
}

// Message après une action : s'affiche en haut de l'écran sans déplacer la page, puis disparaît tout seul
// (4 s ; 9 s pour une erreur). Les paramètres du message sont retirés de l'adresse : un rechargement ne le réaffiche pas.
const FLASH = { ok: 'border-emerald-300 bg-emerald-50 text-emerald-900', warn: 'border-amber-300 bg-amber-50 text-amber-900', err: 'border-red-300 bg-red-50 text-red-800' };
export function Flash({ kind, text }) {
  const [st, setSt] = useState('show');
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      ['m', 'ref', 'k', 'a', 'd', 't'].forEach((k) => u.searchParams.delete(k));
      window.history.replaceState(window.history.state, '', u.pathname + u.search);
    } catch {}
    const ms = kind === 'err' ? 9000 : 4000;
    const t1 = setTimeout(() => setSt('fade'), ms);
    const t2 = setTimeout(() => setSt('gone'), ms + 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [kind]);
  if (st === 'gone') return null;
  return (
    <p role={kind === 'err' ? 'alert' : 'status'} className={`fixed left-1/2 top-3 z-50 flex w-[min(92vw,640px)] -translate-x-1/2 items-start justify-between gap-3 rounded-xl border px-4 py-2.5 text-sm font-bold shadow-lg transition-opacity duration-300 ${FLASH[kind]} ${st === 'fade' ? 'opacity-0' : 'opacity-100'}`}>
      <span>{text}</span>
      <button type="button" onClick={() => setSt('gone')} aria-label="Fermer le message" className="-mr-1 -mt-0.5 shrink-0 rounded-full px-2 text-lg leading-none opacity-60 hover:opacity-100">×</button>
    </p>
  );
}
