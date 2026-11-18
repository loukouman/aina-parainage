'use client';
import { useEffect, useRef, useState } from 'react';
import { PRICE, METHODS, MAX_CHILDREN, fmt } from '@/lib/pricing';

function Turnstile({ siteKey, onToken }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!siteKey) return;
    let id;
    const mount = () => { id = window.turnstile.render(ref.current, { sitekey: siteKey, callback: onToken, 'expired-callback': () => onToken('') }); };
    if (window.turnstile) mount();
    else {
      const s = document.createElement('script');
      s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      s.async = true; s.onload = mount; document.head.appendChild(s);
    }
    return () => { try { window.turnstile?.remove(id); } catch {} };
  }, [siteKey]);
  return siteKey ? <div ref={ref} className="mt-4" /> : null;
}

export default function SponsorForm({ turnstileKey }) {
  const [f, setF] = useState({ type: 'particulier', name: '', contact: '', phone: '', method: 'orange', anonymous: false });
  const [count, setCount] = useState('1');
  const [token, setToken] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const n = Math.min(MAX_CHILDREN, Math.max(1, parseInt(count, 10) || 1));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const ent = f.type === 'entreprise';

  async function submit(e) {
    e.preventDefault(); setErr(''); setBusy(true);
    try {
      const r = await fetch('/api/pledge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, children: n, turnstile: token }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Une erreur est survenue.');
      window.location.href = d.url;
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  return (
    <form onSubmit={submit}>
      <h3 className="pr-12 text-2xl font-extrabold">Parrainer un enfant</h3>
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-sable p-1" role="radiogroup" aria-label="Type de profil">
        {[['particulier', 'Particulier'], ['entreprise', 'Entreprise / Institution']].map(([k, l]) => (
          <button type="button" key={k} role="radio" aria-checked={f.type === k} onClick={() => setF({ ...f, type: k })}
            className={`min-h-[48px] rounded-xl px-2 text-sm font-extrabold ${f.type === k ? 'bg-nuit text-white' : ''}`}>{l}</button>
        ))}
      </div>
      <label className="mt-4 block text-sm font-extrabold">{ent ? "Raison sociale / Nom de l'entreprise" : 'Nom et prénom(s)'}
        <input className="field" required minLength={2} maxLength={120} autoComplete={ent ? 'organization' : 'name'} value={f.name} onChange={set('name')} /></label>
      {ent && <label className="mt-4 block text-sm font-extrabold">Nom du contact référent (facultatif)
        <input className="field" maxLength={120} value={f.contact} onChange={set('contact')} /></label>}
      <label className="mt-4 block text-sm font-extrabold">Téléphone (Mobile Money)
        <input className="field" required type="tel" inputMode="tel" autoComplete="tel" placeholder="+226 XX XX XX XX" value={f.phone} onChange={set('phone')} /></label>

      <fieldset className="mt-5"><legend className="text-sm font-extrabold">Nombre d&apos;enfants à parrainer</legend>
        <div className="mt-2 flex items-center gap-3">
          <button type="button" aria-label="Moins" className="h-12 w-12 rounded-full bg-sable text-2xl font-extrabold" onClick={() => setCount(String(Math.max(1, n - 1)))}>−</button>
          <input aria-label="Nombre d'enfants" className="field !mt-0 text-center text-xl" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, '').slice(0, 4))} onBlur={() => setCount(String(n))} />
          <button type="button" aria-label="Plus" className="h-12 w-12 rounded-full bg-sable text-2xl font-extrabold" onClick={() => setCount(String(Math.min(MAX_CHILDREN, n + 1)))}>+</button>
        </div>
        <div className="mt-3 rounded-2xl bg-nuit p-4 text-white" aria-live="polite">
          <div className="flex items-baseline justify-between"><span className="text-sm text-sable">Total à payer</span><span className="text-2xl font-extrabold">{fmt(n * PRICE.unit)} FCFA</span></div>
          <p className="mt-2 text-sm text-sable">{n} × (1 tee-shirt, 1 repas chaud + boisson, 1 jouet) · {fmt(PRICE.unit)} FCFA par enfant</p>
        </div>
      </fieldset>

      <fieldset className="mt-5"><legend className="text-sm font-extrabold">Moyen de paiement</legend>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {METHODS.map((m) => (
            <label key={m.key} className="block cursor-pointer">
              <input className="peer sr-only" type="radio" name="method" checked={f.method === m.key} onChange={() => setF({ ...f, method: m.key })} />
              <span className="flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-[#E4D5C3] px-1 text-center text-sm font-extrabold peer-checked:border-nuit peer-checked:bg-nuit peer-checked:text-white peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-soleil">{m.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm font-bold">
        <input type="checkbox" className="mt-0.5 h-5 w-5 accent-[#CF2F36]" checked={f.anonymous} onChange={(e) => setF({ ...f, anonymous: e.target.checked })} />
        <span>Rester anonyme sur la liste publique des parrains <span className="block font-medium text-nuit/70">Votre identité reste enregistrée pour l&apos;organisation.</span></span>
      </label>

      <Turnstile siteKey={turnstileKey} onToken={setToken} />
      {err && <p role="alert" className="mt-4 rounded-xl bg-sable p-3 text-sm font-bold">{err}</p>}
      <button className="btn mt-5 w-full" disabled={busy}>{busy ? 'Redirection vers le paiement…' : `Payer ${fmt(n * PRICE.unit)} FCFA`}</button>
      <p className="mt-3 text-center text-xs text-nuit/70">Votre parrainage n&apos;est validé qu&apos;après confirmation du paiement par l&apos;opérateur.</p>
    </form>
  );
}
