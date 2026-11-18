'use client';
import { useEffect, useRef, useState } from 'react';

const DELAY = 5000; // durée d'affichage de chaque photo, en millisecondes (5000 = 5 secondes)

const DEFAULTS = [
  { title: 'Ma Fête à Karpala', text: 'Du 22 au 27 décembre 2026', bg: 'from-[#17583B] to-[#2F8456]' },
  { title: 'Un jouet, un repas chaud, un tee-shirt', text: 'Pour chaque enfant parrainé', bg: 'from-[#B02A30] to-[#CF2F36]' },
  { title: 'Les talents fêtent Noël', text: 'Rejoignez la communauté des parrains', bg: 'from-[#17583B] to-[#B02A30]' },
];

export default function Panneau({ slides = [] }) {
  const items = slides.length ? slides : DEFAULTS;
  const n = items.length;
  const track = n > 1 ? [...items, items[0]] : items; // la 1re photo est répétée à la fin : boucle sans coupure
  const [idx, setIdx] = useState(0);
  const [anim, setAnim] = useState(true);
  const [hold, setHold] = useState(false);     // souris dessus, focus clavier ou doigt posé
  const [paused, setPaused] = useState(false); // bouton pause
  const [reduce, setReduce] = useState(false);
  const x0 = useRef(null);
  const backFromStart = useRef(false);
  const cur = idx % n;

  useEffect(() => { setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches); }, []);

  // Défilement automatique, en boucle infinie.
  useEffect(() => {
    if (n < 2 || hold || paused || idx >= n) return;
    const t = setTimeout(() => setIdx((v) => (v >= n ? v : v + 1)), DELAY);
    return () => clearTimeout(t);
  }, [n, hold, paused, idx]);

  // Arrivé sur la copie de la 1re photo : retour invisible au début.
  useEffect(() => { if (idx === n && n > 1 && reduce) { setAnim(false); setIdx(0); } }, [idx, n, reduce]);
  const onEnd = () => { if (idx === n && n > 1) { setAnim(false); setIdx(0); } };
  // Réactive l'animation juste après un saut invisible.
  useEffect(() => {
    if (anim) return;
    const r = requestAnimationFrame(() => requestAnimationFrame(() => {
      setAnim(true);
      if (backFromStart.current) { backFromStart.current = false; setIdx(n - 1); }
    }));
    return () => cancelAnimationFrame(r);
  }, [anim, n]);

  const next = () => setIdx((v) => (v >= n ? v : v + 1));
  const prev = () => {
    if (idx > 0) { setIdx(idx - 1); return; }
    backFromStart.current = true; setAnim(false); setIdx(n);
  };

  return (
    <section aria-roledescription="carrousel" aria-label="Les moments de la fête" className="mx-auto max-w-[1100px] px-5 py-10">
      <h2 className="mb-4 text-[26px] font-extrabold md:text-[32px]">Les moments de la fête</h2>
      <div className="relative overflow-hidden rounded-3xl border-4 border-soleil bg-nuit shadow-xl"
        onPointerEnter={(e) => e.pointerType === 'mouse' && setHold(true)}
        onPointerLeave={(e) => e.pointerType === 'mouse' && setHold(false)}
        onFocus={(e) => e.target.matches(':focus-visible') && setHold(true)} onBlur={() => setHold(false)}
        onTouchStart={(e) => { x0.current = e.touches[0].clientX; setHold(true); }}
        onTouchEnd={(e) => { const dx = e.changedTouches[0].clientX - (x0.current ?? 0); if (Math.abs(dx) > 40) (dx < 0 ? next() : prev()); setHold(false); }}>
        <div onTransitionEnd={onEnd} aria-live={hold || paused ? 'polite' : 'off'}
          className="flex aspect-[4/3] sm:aspect-[16/9] lg:aspect-[21/9]"
          style={{ transform: `translateX(-${idx * 100}%)`, transition: anim && !reduce ? 'transform 700ms ease-in-out' : 'none' }}>
          {track.map((s, k) => (
            <div key={k} role="group" aria-roledescription="diapositive" aria-label={`${(k % n) + 1} sur ${n}`} aria-hidden={k !== cur} className="relative h-full min-w-full">
              {s.src ? (
                <>
                  <img src={s.src} alt={k === n ? '' : s.alt || ''} loading={k === 0 ? 'eager' : 'lazy'} draggable={false} style={s.pos ? { objectPosition: s.pos } : undefined} className="h-full w-full object-cover" />
                  {s.caption && <p className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-5 pb-10 pt-12 text-lg font-extrabold text-white">{s.caption}</p>}
                </>
              ) : (
                <div className={`flex h-full w-full flex-col items-center justify-center bg-gradient-to-br ${s.bg} px-6 text-center text-white`}>
                  <p className="text-2xl font-extrabold text-soleil sm:text-4xl">{s.title}</p>
                  <p className="mt-2 text-base sm:text-xl">{s.text}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {n > 1 && (<>
          <button aria-label="Photo précédente" onClick={prev} className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-extrabold text-nuit shadow">‹</button>
          <button aria-label="Photo suivante" onClick={next} className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-extrabold text-nuit shadow">›</button>
          <div className="absolute inset-x-0 bottom-2 flex items-center justify-center gap-1">
            {n <= 8 ? items.map((_, k) => (
              <button key={k} aria-label={`Aller à la photo ${k + 1}`} aria-current={k === cur} onClick={() => setIdx(k)} className="flex h-6 w-6 items-center justify-center">
                <span className={`block h-3 rounded-full transition-all ${k === cur ? 'w-6 bg-soleil' : 'w-3 bg-white/80'}`} />
              </button>
            )) : <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-extrabold text-nuit">{cur + 1} / {n}</span>}
            <button aria-label={paused ? 'Reprendre le défilement' : 'Mettre en pause le défilement'} aria-pressed={paused} onClick={() => setPaused(!paused)} className="ml-2 flex h-7 w-7 items-center justify-center rounded-full bg-white/90 text-nuit">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">{paused ? <path d="M2 1l9 5-9 5z" /> : <><rect x="2" y="1" width="3" height="10" /><rect x="7" y="1" width="3" height="10" /></>}</svg>
            </button>
          </div>
        </>)}
      </div>
    </section>
  );
}
