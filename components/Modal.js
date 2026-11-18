'use client';
import { useEffect } from 'react';
import Garland from './Garland';

// closeOnOverlay=false : un clic à côté de la fenêtre ne la ferme pas (évite de perdre une saisie).
export default function Modal({ label, onClose, children, closeOnOverlay = true }) {
  useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-nuit/65 px-3 py-4 sm:px-4 sm:py-10" onClick={closeOnOverlay ? onClose : undefined}>
      <div role="dialog" aria-modal="true" aria-label={label} onClick={(e) => e.stopPropagation()}
        className="relative mx-auto w-full max-w-[520px] overflow-hidden rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="-mx-5 -mt-5 mb-3 bg-creme sm:-mx-7 sm:-mt-7"><Garland count={6} /></div>
        <button onClick={onClose} aria-label="Fermer" className="absolute right-3.5 top-14 z-10 h-11 w-11 rounded-full bg-sable text-xl font-extrabold">×</button>
        {children}
      </div>
    </div>
  );
}
