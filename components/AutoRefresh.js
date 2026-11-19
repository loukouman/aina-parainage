'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Rafraîchit les données de la page toutes les « seconds » secondes, sans la recharger entièrement :
// la position de défilement et les messages affichés sont conservés. Il ne fait rien quand l'onglet est
// masqué ni pendant qu'une action est en cours d'envoi.
export default function AutoRefresh({ seconds = 5 }) {
  const router = useRouter();
  useEffect(() => {
    const tick = () => {
      if (document.visibilityState !== 'visible') return;
      if (document.querySelector('form button:disabled')) return; // action en cours
      router.refresh();
    };
    const t = setInterval(tick, seconds * 1000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', tick); };
  }, [router, seconds]);
  return null;
}
