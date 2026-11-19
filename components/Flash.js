'use client';
import { useEffect, useState } from 'react';

// Message de confirmation affiché après une action : il disparaît tout seul et l'adresse est nettoyée
// (plus de ?m=…&ref=… dans la barre d'adresse), pour qu'il ne revienne pas si on recharge la page.
export default function Flash({ role, className = '', children, seconds = 6 }) {
  const [on, setOn] = useState(true);
  useEffect(() => {
    try {
      const u = new URL(window.location.href);
      ['m', 'ref', 'k', 'a', 'd', 't'].forEach((k) => u.searchParams.delete(k));
      window.history.replaceState(window.history.state, '', u.pathname + u.search + u.hash);
    } catch {}
    const t = setTimeout(() => setOn(false), seconds * 1000);
    return () => clearTimeout(t);
  }, [seconds]);
  if (!on) return null;
  return (
    <p role={role} className={`flex items-start justify-between gap-3 ${className}`}>
      <span>{children}</span>
      <button type="button" onClick={() => setOn(false)} aria-label="Fermer le message" className="shrink-0 rounded px-1.5 text-base leading-none opacity-60 hover:opacity-100">×</button>
    </p>
  );
}
