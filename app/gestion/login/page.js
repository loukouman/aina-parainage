import crypto from 'crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verify } from '@node-rs/argon2';
import { db } from '@/lib/supabase';
import { adminBase, startSession } from '@/lib/auth';
import { sendMail } from '@/lib/mail';
import { audit, clientIp, hashKey, limited } from '@/lib/security';
import AuthShell, { Alert, Field, Tabs } from '@/components/AuthShell';
import { Icon } from '@/components/AuthIcons';
import { PasswordInput, SubmitButton } from '@/components/AuthClient';
export const dynamic = 'force-dynamic';

// ADMIN_REQUIRE_CODE=false : connexion avec l'e-mail et le mot de passe seulement.
// Par défaut (true) : un code à 6 chiffres envoyé par e-mail est demandé en plus.
const codeRequired = () => process.env.ADMIN_REQUIRE_CODE !== 'false';

const MSG = {
  1: 'E-mail ou mot de passe invalide.',
  rate: 'Trop de tentatives. Patientez quelques minutes.',
  mail: "L'envoi de l'e-mail a échoué. Réessayez.",
  code: 'Code incorrect ou expiré.',
  pending: 'Votre compte est en attente d’approbation par un administrateur. Réessayez après son accord.',
};

export default function Login({ searchParams }) {
  async function demander(fd) {
    'use server';
    const b = adminBase();
    const email = String(fd.get('email') || '').trim().toLowerCase().slice(0, 200);
    const pw = String(fd.get('password') || '').slice(0, 200);
    if ((await limited('login:' + hashKey(clientIp(headers())), 5, 10)) || (await limited('loginmail:' + hashKey(email), 10, 30))) redirect(`${b}/login?e=rate`);
    const { data: u } = await db().from('admin_users').select('*').eq('email', email).maybeSingle();
    let ok = false;
    try { ok = !!u && (await verify(u.password_hash, pw)); } catch {}
    if (!ok) { await audit(email || '?', 'admin_login_failed'); redirect(`${b}/login?e=1`); }
    // Compte créé mais pas encore approuvé (la colonne vaut false seulement pour les demandes en attente).
    if (u.approved === false) { await audit(email, 'admin_login_pending'); redirect(`${b}/login?e=pending`); }

    if (!codeRequired()) {
      await startSession(email);
      await audit(email, 'admin_login');
      redirect(b);
    }

    const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    await db().from('admin_links').delete().eq('email', email);
    await db().from('admin_links').insert({ token_hash: hashKey(email + ':' + code), email, expires_at: new Date(Date.now() + 10 * 60000).toISOString() });
    let sent = true;
    try {
      await sendMail(email, 'Votre code de connexion AÏNA',
        `<p>Votre code de connexion : <b style="font-size:24px;letter-spacing:3px">${code}</b></p><p>Valable 10 minutes, utilisable une seule fois. Ne le partagez avec personne.</p>`);
    } catch (e) { console.error(e); sent = false; }
    await audit(email, sent ? 'admin_code_sent' : 'admin_code_failed');
    redirect(sent ? `${b}/login?step=2&m=${encodeURIComponent(email)}` : `${b}/login?e=mail`);
  }

  async function verifier(fd) {
    'use server';
    const b = adminBase();
    const email = String(fd.get('email') || '').trim().toLowerCase().slice(0, 200);
    const code = String(fd.get('code') || '').replace(/\D/g, '').slice(0, 6);
    if ((await limited('code:' + hashKey(email), 5, 10)) || (await limited('codeip:' + hashKey(clientIp(headers())), 10, 10))) redirect(`${b}/login?e=rate`);
    // Suppression + lecture en une opération : le code ne marche qu'une fois.
    const { data: l } = await db().from('admin_links').delete().eq('token_hash', hashKey(email + ':' + code)).eq('email', email).select().maybeSingle();
    if (!l || new Date(l.expires_at) < new Date()) {
      await audit(email, 'admin_code_failed');
      redirect(`${b}/login?step=2&m=${encodeURIComponent(email)}&e=code`);
    }
    const { data: u } = await db().from('admin_users').select('*').eq('email', email).maybeSingle();
    if (!u || u.approved === false) redirect(`${b}/login?e=pending`);
    await startSession(email);
    await audit(email, 'admin_login');
    redirect(b);
  }

  const e = searchParams?.e;
  const ok = searchParams?.ok;
  const created = ok === 'created';
  const pendingMsg = ok === 'pending';
  const step2 = codeRequired() && searchParams?.step === '2' && searchParams?.m;
  const prefill = created || pendingMsg ? String(searchParams?.m || '').slice(0, 200) : '';
  const testMode = process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY;
  return (
    <AuthShell>
      {!step2 ? (
        <form action={demander} className="card !p-6">
          <Tabs active="login" />
          <h1 className="mt-6 text-2xl font-bold tracking-tight">Connexion</h1>
          <p className="a-muted mt-1 text-sm">Accédez au tableau de bord de l’équipe AÏNA.</p>
          {created && <Alert kind="ok">Compte créé avec succès : vous êtes l’administrateur principal. Connectez-vous.</Alert>}
          {pendingMsg && <Alert kind="info">Demande envoyée. Un administrateur doit approuver votre compte avant votre première connexion.</Alert>}
          {e && <Alert>{MSG[e] || MSG[1]}</Alert>}
          <Field label="E-mail" icon="mail" name="email" type="email" required autoComplete="username" defaultValue={prefill} autoFocus={!prefill} />
          <PasswordInput autoFocus={!!prefill} />
          <SubmitButton className="btn mt-6 w-full">{codeRequired() ? 'Continuer' : 'Se connecter'}</SubmitButton>
          <p className="mt-5 text-center text-sm">Pas encore de compte ? <a href={adminBase() + '/inscription'} className="font-bold text-brique underline underline-offset-2">Créer un compte</a></p>
        </form>
      ) : (
        <form action={verifier} className="card !p-6">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sable text-nuit"><Icon name="shield" size={26} /></span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">Code de vérification</h1>
          <p className="a-muted mt-1 text-sm">Un code à 6 chiffres a été envoyé à <b className="text-nuit">{searchParams.m}</b>. Il est valable 10 minutes.</p>
          {testMode && <Alert kind="info">Mode test : le code est affiché dans le terminal de VS Code.</Alert>}
          {e && <Alert>{MSG[e] || MSG[1]}</Alert>}
          <input type="hidden" name="email" value={searchParams.m} />
          <label className="mt-4 block text-sm font-bold">Code à 6 chiffres
            <input className="field text-center text-2xl tracking-[0.4em]" name="code" inputMode="numeric" maxLength={7} required autoFocus autoComplete="one-time-code" /></label>
          <SubmitButton className="btn mt-6 w-full">Se connecter</SubmitButton>
          <a href={adminBase() + '/login'} className="mt-4 block text-center text-sm font-bold underline underline-offset-2">Recevoir un nouveau code</a>
        </form>
      )}
      <a href="/" className="mt-5 block text-center text-sm font-semibold text-nuit/70 hover:underline">← Retour au site</a>
    </AuthShell>
  );
}
