import crypto from 'crypto';
import { hmacValid } from './security';
import { processPaymentEvent } from './process';
// manual : paiement par code USSD. Le parrainage est validé dès que le parrain déclare avoir payé
//          (contrôle possible ensuite dans l'administration : colonne « Contrôle »). Mode par défaut.
// sandbox : simulateur de tests. Autre valeur : agrégateur de paiement (à brancher ci-dessous).
const provider = () => process.env.PAYMENT_PROVIDER || 'manual';

// Renvoie l'adresse où envoyer le donateur après l'enregistrement de son parrainage.
export async function createCheckout({ ref, amount }) {
  if (provider() === 'manual') {
    await processPaymentEvent({ ref, txId: 'DECL-' + crypto.randomBytes(5).toString('hex'), status: 'SUCCESS', amount });
    return { url: `/recu/${ref}` };
  }
  if (provider() === 'sandbox') return { url: `/sandbox/${ref}` };
  // TODO (agrégateur) : appeler l'API officielle et renvoyer { url: <lien de paiement> }.
  throw new Error('Agrégateur non configuré : complétez lib/payment.js ou utilisez PAYMENT_PROVIDER=manual.');
}

// Authentifie et lit une notification de paiement d'un agrégateur (inutile en mode manual).
export async function parseWebhook(raw, headers) {
  if (!hmacValid(raw, headers.get('x-signature'), process.env.PAYMENT_WEBHOOK_SECRET)) throw new Error('Signature invalide');
  const b = JSON.parse(raw);
  return { ref: String(b.ref), txId: String(b.transaction_id), status: String(b.status).toUpperCase(), amount: Number(b.amount) };
}
