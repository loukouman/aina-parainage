'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

export default function PwaRegister() {
  const path = usePathname();
  const [ev, setEv] = useState(null);
  const [ios, setIos] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') navigator.serviceWorker.register('/sw.js').catch(() => {});
    if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) { setHide(true); return; }
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const onPrompt = (e) => { e.preventDefault(); setEv(e); };
    const onDone = () => setHide(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onDone);
    return () => { window.removeEventListener('beforeinstallprompt', onPrompt); window.removeEventListener('appinstalled', onDone); };
  }, []);

  if (hide || path.startsWith('/admin') || path.startsWith('/gestion') || path.startsWith('/sandbox') || (!ev && !ios)) return null;
  return (
    <div role="region" aria-label="Installer l'application" className="fixed inset-x-3 bottom-3 z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl bg-nuit p-3 text-white shadow-2xl">
      <div className="flex-1 text-sm font-bold">
        {ev ? "Installez AÏNA sur votre téléphone." : "Pour installer : touchez Partager, puis « Sur l'écran d'accueil »."}
      </div>
      {ev && <button className="rounded-full bg-soleil px-4 py-2 text-sm font-extrabold text-nuit" onClick={async () => { ev.prompt(); await ev.userChoice; setEv(null); }}>Installer</button>}
      <button aria-label="Fermer" className="h-9 w-9 rounded-full bg-white/15 text-lg font-extrabold" onClick={() => setHide(true)}>×</button>
    </div>
  );
}
