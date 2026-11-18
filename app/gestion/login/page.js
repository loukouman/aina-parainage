import crypto from 'crypto';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { verify } from '@node-rs/argon2';
import { db } from '@/lib/supabase';
import { adminBase, startSession } from '@/lib/auth';
import { sendMail } from '@/lib/mail';
import { audit, clientIp, hashKey, limited } from '@/lib/security';
import PasswordField from '@/components/PasswordField';
export const dynamic = 'force-dynamic';

// ADMIN_REQUIRE_CODE=false : connexion avec l'e-mail et le mot de passe seulement.
// Par défaut (true) : un code à 6 chiffres envoyé par e-mail est demandé en plus.
const codeRequired = () => process.env.ADMIN_REQUIRE_CODE !== 'false';

const MSG = {
  1: 'E-mail ou mot de passe invalide.',
  rate: 'Trop de tentatives. Patientez quelques minutes.',
  mail: "L'envoi de l'e-mail a échoué. Réessayez.",
  code: 'Code incorrect ou expiré.',
};

export default function Login({ searchParams }) {
  async function demander(fd) {
    'use server';
    const b = adminBase();
    const email = String(fd.get('email') || '').trim().toLowerCase().slice(0, 200);
    const pw = String(fd.get('password') || '').slice(0, 200);
    if ((await limited('login:' + hashKey(clientIp(headers())), 5, 10)) || (await limited('loginmail:' + hashKey(email), 10, 30))) redirect(`${b}/login?e=rate`);
    const { data: u } = await db().from('admin_users').select('email,password_hash').eq('email', email).maybeSingle();
    let ok = false;
    try { ok = !!u && (await verify(u.password_hash, pw)); } catch {}
    if (!ok) { await audit(email || '?', 'admin_login_failed'); redirect(`${b}/login?e=1`); }

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
    await startSession(email);
    await audit(email, 'admin_login');
    redirect(b);
  }

  const e = searchParams?.e;
  const step2 = codeRequired() && searchParams?.step === '2' && searchParams?.m;
  const testMode = process.env.NODE_ENV !== 'production' && !process.env.RESEND_API_KEY;
  return (
    <main className="mx-auto max-w-sm px-4 py-12">
      {!step2 ? (
        <form action={demander} className="card">
          <h1 className="text-2xl font-extrabold">Administration AÏNA</h1>
          {e && <p role="alert" className="mt-3 rounded-xl bg-sable p-3 text-sm font-bold">{MSG[e] || MSG[1]}</p>}
          <label className="mt-4 block text-sm font-extrabold">E-mail<input className="field" name="email" type="email" required autoComplete="username" /></label>
          <PasswordField />
          <button className="btn mt-6 w-full">{codeRequired() ? 'Continuer' : 'Se connecter'}</button>
        </form>
      ) : (
        <form action={verifier} className="card">
          <h1 className="text-2xl font-extrabold">Code de vérification</h1>
          <p className="mt-2 text-sm">Un code à 6 chiffres a été envoyé à <b>{searchParams.m}</b>.</p>
          {testMode && <p className="mt-2 rounded-xl bg-sable p-3 text-sm font-bold">Mode test : le code est affiché dans le terminal de VS Code.</p>}
          {e && <p role="alert" className="mt-3 rounded-xl bg-sable p-3 text-sm font-bold">{MSG[e] || MSG[1]}</p>}
          <input type="hidden" name="email" value={searchParams.m} />
          <label className="mt-4 block text-sm font-extrabold">Code à 6 chiffres
            <input className="field text-center text-2xl tracking-[0.4em]" name="code" inputMode="numeric" maxLength={7} required autoFocus autoComplete="one-time-code" /></label>
          <button className="btn mt-6 w-full">Se connecter</button>
          <a href={adminBase() + '/login'} className="mt-4 block text-center text-sm font-bold underline">Recevoir un nouveau code</a>
        </form>
      )}
    </main>
  );
}
