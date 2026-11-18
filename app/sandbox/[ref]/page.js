import crypto from 'crypto';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/supabase';
import { fmt } from '@/lib/pricing';
import { processPaymentEvent } from '@/lib/process';
export const dynamic = 'force-dynamic';

// Simulateur de paiement : disponible UNIQUEMENT quand PAYMENT_PROVIDER=sandbox (recette, jalon 2).
export default async function Sandbox({ params }) {
  if (process.env.PAYMENT_PROVIDER !== 'sandbox') notFound();
  const { data: p } = await db().from('pledges').select('ref,amount_expected,status,method').eq('ref', params.ref).maybeSingle();
  if (!p) notFound();
  async function pay(fd) {
    'use server';
    const status = String(fd.get('s'));
    if (!['SUCCESS', 'FAILED', 'CANCELLED'].includes(status)) return;
    await processPaymentEvent({ ref: params.ref, txId: 'SBX-' + crypto.randomBytes(6).toString('hex'), status, amount: p.amount_expected });
    redirect(`/recu/${params.ref}`);
  }
  return (
    <main className="mx-auto max-w-md p-6">
      <div className="card text-center">
        <p className="text-sm font-extrabold text-brique">SIMULATEUR DE PAIEMENT (tests)</p>
        <h1 className="mt-2 text-2xl font-extrabold">{fmt(p.amount_expected)} FCFA</h1>
        <p className="mt-1">Référence {p.ref}</p>
        <form action={pay} className="mt-6 flex flex-col gap-3">
          <button name="s" value="SUCCESS" className="btn btn-wa">Simuler un succès</button>
          <button name="s" value="FAILED" className="btn btn-ghost">Simuler un échec</button>
          <button name="s" value="CANCELLED" className="btn btn-ghost">Simuler une annulation</button>
        </form>
      </div>
    </main>
  );
}
