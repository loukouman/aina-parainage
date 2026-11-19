'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from './Modal';
import Garland from './Garland';
import Sapin from './Sapin';
import AinaLogo from './AinaLogo';
import Panneau from './Panneau';
import SponsorWizard from './SponsorWizard';
import { SLIDES } from '@/lib/panneau';
import { PRICE, fmt } from '@/lib/pricing';

function Count({ ms }) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const parts = [['jours', Math.floor(s / 86400)], ['heures', Math.floor((s % 86400) / 3600)], ['min', Math.floor((s % 3600) / 60)], ['sec', s % 60]];
  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3" role="timer">
      {parts.map(([l, v]) => (
        <div key={l} className="rounded-2xl bg-white/10 p-3 text-center">
          <div className="text-3xl font-extrabold tabular-nums sm:text-4xl">{String(v).padStart(2, '0')}</div>
          <div className="text-xs uppercase tracking-wide text-sable">{l}</div>
        </div>
      ))}
    </div>
  );
}

export default function Landing({ initial, canSee, serverNow, open, close, turnstileKey }) {
  const [skew] = useState(() => serverNow - Date.now());
  const [now, setNow] = useState(serverNow);
  const [stats, setStats] = useState(initial);
  const [modal, setModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const closeModal = () => setModal(null);

  useEffect(() => { const t = setInterval(() => setNow(Date.now() + skew), 1000); return () => clearInterval(t); }, [skew]);
  const phase = now < open ? 'waiting' : now >= close ? 'closed' : 'open';
  // Le compteur n'est visible qu'après un parrainage (ou une fois la campagne terminée).
  const visible = canSee || phase === 'closed';
  useEffect(() => {
    if (!visible) return;
    const load = async () => { try { const r = await fetch('/api/stats', { cache: 'no-store' }); if (r.ok) setStats(await r.json()); } catch {} };
    load(); const t = setInterval(load, 8000); return () => clearInterval(t);
  }, [visible]);
  useEffect(() => { if (phase !== 'open' && modal === 'parrain') setModal(null); }, [phase, modal]);
  // Si les dates du calendrier changent, la page se met à jour toute seule (sans recharger ni fermer le formulaire).
  const router = useRouter();
  useEffect(() => {
    const check = async () => {
      if (document.visibilityState !== 'visible') return;
      try {
        const r = await fetch('/api/window', { cache: 'no-store' });
        if (!r.ok) return;
        const w = await r.json();
        if (w.open !== open || w.close !== close) router.refresh();
      } catch {}
    };
    const t = setInterval(check, 8000);
    document.addEventListener('visibilitychange', check);
    return () => { clearInterval(t); document.removeEventListener('visibilitychange', check); };
  }, [open, close, router]);
  const s = stats || { children: 0, sponsors: 0, recent: [] };
  const openLabel = (() => {
    const d = new Date(open), p = (n) => String(n).padStart(2, '0');
    const m = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][d.getUTCMonth()];
    return `${d.getUTCDate()} ${m} ${d.getUTCFullYear()} à ${p(d.getUTCHours())}h${p(d.getUTCMinutes())}`;
  })();

  const url = typeof window !== 'undefined' ? window.location.origin : '';
  const text = 'Parrainez un enfant pour « Ma Fête à Karpala » : un jouet, un repas chaud et un tee-shirt pour 7 500 FCFA.';
  const cta = phase === 'open' && <button className="btn btn-sun" onClick={() => setModal('parrain')}>{canSee ? 'Parrainer un autre enfant' : 'Parrainer un enfant'}</button>;
  const closing = (
    <div className="mt-4 rounded-2xl bg-nuit p-3 text-white">
      <p className="mb-2 text-center text-xs font-bold uppercase tracking-wide text-sable">Clôture dans</p>
      <Count ms={close - now} />
    </div>
  );

  return (
    <main>
      <header className="relative overflow-hidden rounded-b-[28px] bg-gradient-to-b from-sable to-creme pb-16 text-nuit md:rounded-b-[40px] lg:pb-14">
        <Garland className="relative z-10 mb-2" />
        <div className="mx-auto flex max-w-[1500px] items-center justify-center">
          <Sapin className="hidden w-32 shrink-0 lg:block xl:w-44" />
          <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1100px] px-5">
          <div className="relative flex flex-col items-center text-center">
            <AinaLogo className="text-[88px] sm:text-[120px] lg:text-[148px]" />
            <div className="mt-1 text-sm font-bold text-nuit/70 sm:text-base">Ma Fête à Karpala · 2ᵉ édition</div>
            {cta && <span className="absolute right-0 top-0 hidden sm:block">{cta}</span>}
          </div>
          <div className="mt-9 grid items-center gap-8 md:mt-12 md:grid-cols-[1.2fr_1fr] md:gap-10">
            <div>
              {phase === 'waiting' && (<>
                <p className="font-extrabold text-brique">Ouverture officielle des parrainages</p>
                <h1 className="mt-2 text-[34px] font-extrabold leading-[1.1] md:text-5xl">Bientôt, parrainez un enfant pour Noël.</h1>
              </>)}
              {phase === 'open' && <h1 className="text-[34px] font-extrabold leading-[1.1] md:text-5xl lg:text-[52px]">Parrainez un enfant, offrez-lui un vrai Noël.</h1>}
              {phase === 'closed' && <h1 className="text-[34px] font-extrabold leading-[1.1] md:text-5xl">Merci ! Les parrainages sont clos.</h1>}
              <p className="mt-4 max-w-xl text-lg leading-relaxed text-nuit/80">
                {phase === 'closed'
                  ? 'Grâce à vous, des enfants de Karpala vivront une fête inoubliable du 22 au 27 décembre. Merci de tout cœur à chaque parrain.'
                  : 'Pour 7 500 FCFA, un enfant orphelin ou défavorisé de Ouaga reçoit un jouet, un repas chaud avec boisson et un tee-shirt pendant le festival.'}
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <span className="sm:hidden">{cta && <span className="block [&>button]:w-full">{cta}</span>}</span>
                <button className="btn btn-ghost" onClick={() => setModal('partage')}>Partager l&apos;opération</button>
              </div>
            </div>
            <div className="card text-nuit">
              {phase === 'waiting' && (<>
                <p className="mb-3 font-extrabold">Ouverture le {openLabel}</p>
                <div className="rounded-2xl bg-nuit p-3 text-white"><Count ms={open - now} /></div>
              </>)}
              {phase === 'open' && !visible && (<>
                <p className="font-extrabold">Le pack d’un enfant</p>
                <p className="mt-1 text-4xl font-extrabold text-brique">{fmt(PRICE.unit)} <span className="text-lg">FCFA</span></p>
                <p className="mt-1">1 jouet · 1 repas chaud avec boisson · 1 tee-shirt</p>
                {closing}
              </>)}
              {phase === 'open' && visible && (<>
                <p className="inline-block rounded-full bg-sable px-3 py-1 text-sm font-extrabold">Merci, vous êtes parrain !</p>
                <p className="mt-3 font-extrabold">Enfants parrainés à ce jour</p>
                <div className="text-6xl font-extrabold tabular-nums text-brique" aria-live="polite">{fmt(s.children)}</div>
                <p className="mt-1">grâce à {fmt(s.sponsors)} parrain{s.sponsors > 1 ? 's' : ''}</p>
                {closing}
              </>)}
              {phase === 'closed' && (<>
                <p className="font-extrabold">Bilan définitif</p>
                <div className="text-6xl font-extrabold tabular-nums text-brique">{fmt(s.children)}</div>
                <p className="mt-1">enfants parrainés · {fmt(s.sponsors)} parrain{s.sponsors > 1 ? 's' : ''}</p>
              </>)}
            </div>
          </div>
        </div>
      </div>
          <Sapin swap className="hidden w-32 shrink-0 lg:block xl:w-44" />
        </div>
        <Sapin className="absolute bottom-0 left-2 w-12 lg:hidden" />
        <Sapin swap className="absolute bottom-0 right-2 w-12 lg:hidden" />
      </header>

      <Panneau slides={SLIDES} />

      <section className="mx-auto max-w-[900px] px-5 pb-6 pt-2">
        <h2 className="text-[26px] font-extrabold md:text-[32px]">Bienvenue sur AÏNA</h2>
        <p className="mt-2 text-xl font-bold text-brique">Votre plateforme digitale solidaire pour « Ma Fête à Karpala » (2ᵉ édition) !</p>
        <p className="mt-4 text-lg leading-relaxed">Du <b>22 au 27 décembre 2026</b>, Kilimandjaro Kids Events réunit les enfants de Ouagadougou autour du thème « <b>Les talents fêtent Noël</b> ».</p>
        <p className="mt-3 text-lg leading-relaxed">Grâce à AÏNA, soutenir un enfant orphelin ou défavorisé n’a jamais été aussi simple et immédiat. En quelques clics depuis votre téléphone ou votre ordinateur, transformez votre monnaie digitale en un véritable élan de générosité : chaque contribution mobile est directement convertie en kits cadeaux et en moments festifs.</p>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="card border-l-8 border-soleil"><h3 className="text-xl font-extrabold">Votre geste prend vie en direct</h3><p className="mt-1.5 leading-relaxed">Tous les cadeaux financés via la plateforme seront officiellement remis aux enfants orphelins le <b>mardi 22 décembre 2026</b>, lors de la cérémonie d’ouverture de la fête !</p></div>
          <div className="card border-l-8 border-brique"><h3 className="text-xl font-extrabold">100 % digital, rapide et transparent</h3><p className="mt-1.5 leading-relaxed">Payez par Orange Money ou Moov Money, depuis votre téléphone.</p></div>
        </div>
      </section>

      <section className="mx-auto max-w-[1100px] px-5 py-14">
        <h2 className="text-[26px] font-extrabold md:text-[32px]">Le pack d’un enfant : {fmt(PRICE.unit)} FCFA</h2>
        <p className="mt-2 max-w-2xl text-lg">Chaque franc est affecté : voici exactement ce que finance un parrainage.</p>
        <div className="mt-6 grid gap-5 md:grid-cols-3">
          {PRICE.parts.map((p) => (
            <div key={p.key} className="card">
              <h3 className="text-xl font-extrabold">{p.label}</h3>
              <p className="mt-1 text-3xl font-extrabold text-brique">{fmt(p.amount)} <span className="text-base">FCFA</span></p>
              <div className="mt-3 h-2.5 rounded-full bg-sable"><div className="h-2.5 rounded-full bg-brique" style={{ width: `${(p.amount / PRICE.unit) * 100}%` }} /></div>
              <p className="mt-1.5 text-sm font-bold">{((p.amount / PRICE.unit) * 100).toFixed(2).replace('.', ',')} %</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-sable py-14">
        <div className="mx-auto max-w-[1100px] px-5">
          <h2 className="mb-6 text-[26px] font-extrabold md:text-[32px]">Comment ça marche</h2>
          <ol className="grid gap-5 md:grid-cols-3">
            {[['Vos informations', 'Particulier ou entreprise : votre nom et votre numéro Mobile Money.'], ['Votre parrainage', 'Choisissez le nombre d’enfants et votre moyen de paiement : Orange Money ou Moov Money.'], ['Confirmation', 'Vérifiez vos informations, payez, puis recevez votre reçu.']].map(([t, d], i) => (
              <li key={t} className="card"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-soleil font-extrabold">{i + 1}</div><h3 className="text-xl font-extrabold">{t}</h3><p className="mt-1.5 leading-relaxed">{d}</p></li>
            ))}
          </ol>
        </div>
      </section>

      {visible && (
        <section className="mx-auto max-w-[1100px] px-5 py-14">
          <h2 className="text-[26px] font-extrabold md:text-[32px]">Les parrains</h2>
          {s.recent?.length ? (
            <ul className="mt-5 flex flex-wrap gap-3">{s.recent.map((r, i) => <li key={i} className="rounded-full bg-white px-4 py-2 font-bold shadow">{r.name} · {r.children} enfant{r.children > 1 ? 's' : ''}</li>)}</ul>
          ) : <p className="mt-3 text-lg">Soyez le premier parrain !</p>}
        </section>
      )}

      <section className="relative overflow-hidden bg-sable px-5 pb-24 text-center text-nuit sm:pb-14">
        <Sapin className="absolute bottom-0 left-2 w-12 sm:w-20" />
        <Sapin swap className="absolute bottom-0 right-2 w-12 sm:w-20" />
        <div className="-mx-5"><Garland /></div>
        <div className="pt-6" />
        <h2 className="text-2xl font-extrabold">Ma Fête à Karpala · 2ᵉ édition</h2>
        <p className="mx-auto mt-2 max-w-xl text-nuit/80">Du 22 au 27 décembre 2026 · « Les talents fêtent Noël » · Karpala, Ouagadougou</p>
      </section>
      <footer className="bg-[#14472F] py-6 text-center text-sm text-sable">AÏNA · Une initiative de KILIMANDJARO Kids Events · Ouagadougou, Karpala</footer>

      {modal === 'parrain' && <Modal label="Parrainer un enfant" onClose={closeModal} closeOnOverlay={false}><SponsorWizard turnstileKey={turnstileKey} /></Modal>}
      {modal === 'partage' && (
        <Modal label="Partager" onClose={closeModal}>
          <h3 className="pr-12 text-2xl font-extrabold">Faites passer le mot</h3>
          <p className="mt-1.5">Chaque partage fait grandir la communauté des parrains.</p>
          <div className="mt-5 flex flex-col gap-3">
            <a className="btn btn-wa" target="_blank" rel="noopener noreferrer" href={`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`}>WhatsApp</a>
            <a className="btn btn-nuit" target="_blank" rel="noopener noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Facebook</a>
            <button className="btn btn-ghost" onClick={async () => { try { await navigator.clipboard.writeText(url); setCopied(true); } catch {} }}>{copied ? 'Lien copié' : 'Copier le lien (pour TikTok)'}</button>
          </div>
        </Modal>
      )}
    </main>
  );
}
