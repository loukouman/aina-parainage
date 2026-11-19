// Logo « AÏNA » : lettrage seul (sans image), en grand, façon logo de la plateforme.
// Taille pilotée par la taille de police du parent (tout est en em), ex. className="text-[120px]".
// Le texte visible est découpé en lettres : on l'expose donc comme une image nommée « AÏNA ».
export default function AinaLogo({ className = '' }) {
  return (
    <div role="img" aria-label="AÏNA" className={`relative inline-block select-none pt-[0.3em] pl-[0.2em] leading-none text-brique ${className}`}>
      <span aria-hidden="true" className="font-logo font-bold tracking-[0.03em]">
        A
        <span className="relative inline-block">
          I
          {/* étoile au-dessus du I, à la place du tréma */}
          <svg viewBox="-10 -10 20 20" className="absolute left-1/2 top-[-0.27em] h-[0.3em] w-[0.3em] -translate-x-1/2">
            <path fill="#E8A92B" d="M0-10 2.9-3.1 9.5-3.1 4.2 1.2 6 8.1 0 4.2-6 8.1-4.2 1.2-9.5-3.1-2.9-3.1Z" />
          </svg>
          {/* petite étincelle */}
          <svg viewBox="-10 -10 20 20" className="absolute left-full top-[-0.46em] ml-[0.04em] h-[0.1em] w-[0.1em]">
            <path fill="#E8A92B" d="M0-10 2.2-2.2 10 0 2.2 2.2 0 10-2.2 2.2-10 0-2.2-2.2Z" />
          </svg>
        </span>
        NA
        {/* boucle calligraphique à gauche du A */}
        <svg viewBox="0 0 62 72" className="absolute left-[-0.26em] top-[0.5em] h-[0.72em] w-[0.62em] overflow-visible">
          <path d="M60 34 C42 26 10 32 8 50 C6 66 34 68 38 52 C41 41 24 40 20 50 C18 56 26 58 30 54" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  );
}
