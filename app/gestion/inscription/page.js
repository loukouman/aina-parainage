import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { hash } from '@node-rs/argon2';
import { db } from '@/lib/supabase';
import { adminBase } from '@/lib/auth';
import { audit, clientIp, hashKey, limited } from '@/lib/security';
import AuthShell, { Alert, Field, Tabs } from '@/components/AuthShell';
import { SignupPasswords, SubmitButton } from '@/components/AuthClient';
export const dynamic = 'force-dynamic';

const MAX_PENDING = 20; // au-delà, les nouvelles demandes sont refusées (anti-spam)
const MSG = {
  rate: 'Trop de tentatives. Patientez quelques minutes.',
  email: 'Adresse e-mail invalide.',
  short: 'Le mot de passe doit contenir au moins 12 caractères.',
  match: 'Les deux mots de passe ne sont pas identiques.',
  exists: 'Un compte existe déjà avec cet e-mail. Connectez-vous.',
  full: 'Trop de demandes en attente. Contactez un administrateur.',
  db: 'Impossible d’enregistrer le compte pour le moment. Réessayez.',
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function Inscription({ searchParams }) {
  async function creer(fd) {
    'use server';
    const b = adminBase();
    const email = String(fd.get('email') || '').trim().toLowerCase().slice(0, 200);
    const pw = String(fd.get('password') || '').slice(0, 200);
    const pw2 = String(fd.get('password2') || '').slice(0, 200);
    const back = (e) => redirect(`${b}/inscription?e=${e}&m=${encodeURIComponent(email)}`);

    if (await limited('signup:' + hashKey(clientIp(headers())), 6, 15)) back('rate');
    if (!EMAIL.test(email)) back('email');
    if (pw.length < 12) back('short');
    if (pw !== pw2) back('match');

    let first = false;
    try {
      // Premier compte d'une base vide = administrateur principal, actif tout de suite.
      // Les suivants sont « en attente » jusqu'à l'approbation d'un administrateur.
      const { count: total } = await db().from('admin_users').select('*', { count: 'exact', head: true });
      first = (total || 0) === 0;
      if (!first) {
        const { count: pending } = await db().from('admin_users').select('*', { count: 'exact', head: true }).eq('approved', false);
        if ((pending || 0) >= MAX_PENDING) back('full');
      }
      const { error } = await db().from('admin_users').insert({ email, password_hash: await hash(pw), approved: first });
      if (error) {
        if (error.code === '23505') back('exists');
        throw error;
      }
    } catch (e) {
      if (e?.digest?.startsWith?.('NEXT_REDIRECT')) throw e;
      console.error('signup', e);
      back('db');
    }
    await audit(email, first ? 'admin_signup_first' : 'admin_signup_request');
    redirect(`${b}/login?ok=${first ? 'created' : 'pending'}&m=${encodeURIComponent(email)}`);
  }

  const e = searchParams?.e;
  const m = String(searchParams?.m || '').slice(0, 200);
  return (
    <AuthShell>
      <form action={creer} className="card !p-6">
        <Tabs active="signup" />
        <h1 className="mt-6 text-2xl font-bold tracking-tight">Créer un compte</h1>
        <p className="a-muted mt-1 text-sm">Un administrateur devra approuver votre demande avant votre première connexion.</p>
        {e && <Alert>{MSG[e] || MSG.db}</Alert>}
        <Field label="E-mail" icon="mail" name="email" type="email" required autoComplete="username" defaultValue={m} autoFocus={!m} />
        <SignupPasswords />
        <SubmitButton className="btn mt-6 w-full">Créer mon compte</SubmitButton>
        <p className="mt-5 text-center text-sm">Déjà un compte ? <a href={adminBase() + '/login'} className="font-bold text-brique underline underline-offset-2">Se connecter</a></p>
      </form>
      <a href="/" className="mt-5 block text-center text-sm font-semibold text-nuit/70 hover:underline">← Retour au site</a>
    </AuthShell>
  );
}
