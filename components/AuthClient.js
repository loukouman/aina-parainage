'use client';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import { Icon } from './AuthIcons';

export function SubmitButton({ children, className = '' }) {
  const { pending } = useFormStatus();
  return <button disabled={pending} className={className}>{pending ? 'Veuillez patienter…' : children}</button>;
}

function Eye({ show }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />{show && <path d="M3 3l18 18" />}
    </svg>
  );
}

function Pw({ label, name, autoComplete, show, setShow, value, onChange, autoFocus }) {
  return (
    <label className="mt-4 block text-sm font-bold">{label}
      <div className="relative mt-1.5">
        <Icon name="lock" size={19} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-nuit/50" />
        <input className="field !mt-0 !pl-11 !pr-14" name={name} type={show ? 'text' : 'password'} required autoComplete={autoComplete} autoFocus={autoFocus}
          {...(onChange ? { value, onChange: (e) => onChange(e.target.value) } : {})} />
        <button type="button" onClick={() => setShow(!show)} aria-pressed={show} aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-nuit hover:bg-sable"><Eye show={show} /></button>
      </div>
    </label>
  );
}

// Connexion : un seul champ mot de passe.
export function PasswordInput({ autoFocus }) {
  const [show, setShow] = useState(false);
  return <Pw label="Mot de passe" name="password" autoComplete="current-password" show={show} setShow={setShow} autoFocus={autoFocus} />;
}

// Création de compte : mot de passe + confirmation, indicateur de solidité (12 caractères minimum).
const LEVELS = [['Trop court (12 caractères minimum)', 'bg-red-500', 'text-red-700'], ['Acceptable', 'bg-amber-500', 'text-amber-700'], ['Bon', 'bg-lime-500', 'text-lime-800'], ['Très bon', 'bg-emerald-500', 'text-emerald-700'], ['Excellent', 'bg-emerald-600', 'text-emerald-800']];
function level(p) {
  if (!p) return -1;
  if (p.length < 12) return 0;
  return 1 + (/[a-z]/.test(p) && /[A-Z]/.test(p) ? 1 : 0) + (/\d/.test(p) ? 1 : 0) + (/[^A-Za-z0-9]/.test(p) ? 1 : 0);
}
export function SignupPasswords() {
  const [show, setShow] = useState(false);
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const l = level(pw);
  return (
    <>
      <Pw label="Mot de passe" name="password" autoComplete="new-password" show={show} setShow={setShow} value={pw} onChange={setPw} />
      <div className="mt-2" aria-live="polite">
        <div className="flex gap-1.5">{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${l >= 0 && (l === 0 ? i === 1 : i <= l) ? LEVELS[l][1] : 'bg-sable'}`} />)}</div>
        <p className={`mt-1 text-xs font-bold ${l >= 0 ? LEVELS[l][2] : 'a-muted'}`}>{l >= 0 ? LEVELS[l][0] : '12 caractères minimum.'}</p>
      </div>
      <Pw label="Confirmer le mot de passe" name="password2" autoComplete="new-password" show={show} setShow={setShow} value={pw2} onChange={setPw2} />
      {pw2 && <p aria-live="polite" className={`mt-1 text-xs font-bold ${pw === pw2 ? 'text-emerald-700' : 'text-red-700'}`}>{pw === pw2 ? '✓ Les mots de passe correspondent' : 'Les mots de passe ne correspondent pas'}</p>}
    </>
  );
}
