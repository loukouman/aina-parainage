// Envoi via Resend (https://resend.com). En développement sans clé, le message s'affiche dans le terminal.
export async function sendMail(to, subject, html) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    if (process.env.NODE_ENV === 'production') throw new Error('RESEND_API_KEY manquante');
    console.log(`\n[E-MAIL de test] à ${to} : ${subject}\n${html.replace(/<[^>]+>/g, ' ')}\n`);
    return;
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: process.env.MAIL_FROM || 'AÏNA <onboarding@resend.dev>', to: [to], subject, html }),
  });
  if (!r.ok) throw new Error('Envoi e-mail échoué : ' + r.status);
}
