import { db } from './supabase';
import { audit } from './security';
// Valide le parrainage dans UNE transaction SQL (verrou de ligne, montant vérifié, idempotence).
export async function processPaymentEvent({ ref, txId, status, amount }) {
  const { data, error } = await db().rpc('apply_payment', { p_ref: ref, p_tx: txId, p_status: status, p_amount: amount });
  if (error) throw error;
  await audit('payment', `payment_${data}`, ref, { txId, status, amount });
  return data;
}
