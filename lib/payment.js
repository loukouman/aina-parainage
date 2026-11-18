import { hmacValid } from './security';
const provider = () => process.env.PAYMENT_PROVIDER || 'sandbox';

// Lance le paiement Mobile Money et renvoie l'URL où envoyer le donateur.
export async function createCheckout({ ref, amount, phone, method }) {
  if (provider() === 'sandbox') return { url: `/sandbox/${ref}` };
  // TODO (agrégateur : Ligdicash, CinetPay, PayDunya...) :
  // appeler l'API officielle avec { ref, amount, phone, method, return_url: `${SITE.url}/recu/${ref}`,
  // notify_url: `${SITE.url}/api/payment/webhook` } puis renvoyer { url: <lien de paiement> }.
  throw new Error('Agrégateur non configuré : complétez lib/payment.js (voir README).');
}

// Authentifie et lit une notification de paiement. Doit renvoyer
// { ref, txId, status: 'SUCCESS' | 'FAILED' | 'CANCELLED', amount }.
export async function parseWebhook(raw, headers) {
  if (!hmacValid(raw, headers.get('x-signature'), process.env.PAYMENT_WEBHOOK_SECRET)) throw new Error('Signature invalide');
  const b = JSON.parse(raw);
  // TODO : adapter ces noms de champs au format réel de l'agrégateur retenu et, idéalement,
  // confirmer le statut en interrogeant l'API de l'agrégateur avant de valider.
  return { ref: String(b.ref), txId: String(b.transaction_id), status: String(b.status).toUpperCase(), amount: Number(b.amount) };
}
