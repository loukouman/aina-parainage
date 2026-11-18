'use client';
import { useState } from 'react';
export default function PasswordField() {
  const [show, setShow] = useState(false);
  return (
    <label className="mt-4 block text-sm font-extrabold">Mot de passe
      <div className="relative mt-1.5">
        <input className="field !mt-0 !pr-14" name="password" type={show ? 'text' : 'password'} required autoComplete="current-password" />
        <button type="button" onClick={() => setShow(!show)} aria-pressed={show}
          aria-label={show ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          className="absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-nuit hover:bg-sable">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {show && <path d="M3 3l18 18" />}
          </svg>
        </button>
      </div>
    </label>
  );
}
