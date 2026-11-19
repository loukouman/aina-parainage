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

// Même règle que le serveur : +226 suivi de 8 chiffres (les 8 chiffres seuls sont acceptés).
const normPhone = (v) => String(v).replace(/[\s.\-()]/g, '').replace(/^00226/, '+226').replace(/^226/, '+226').replace(/^(\d{8})$/, '+226$1');
const phoneOk = (v) => /^\+226\d{8}$/.test(normPhone(v));
const pretty = (p) => normPhone(p).replace(/^\+226(\d{2})(\d{2})(\d{2})(\d{2})$/, '+226 $1 $2 $3 $4');

export default function SponsorWizard({ turnstileKey }) {
  const [step, setStep] = useState(1);
  const [f, setF] = useState({ type: 'particulier', name: '', contact: '', phone: '', method: '', anonymous: false });
  const [count, setCount] = useState('1');
  const [token, setToken] = useState('');
  const [errs, setErrs] = useState({});
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const head = useRef(null);
  const n = Math.min(MAX_CHILDREN, Math.max(1, parseInt(count, 10) || 1));
  const ent = f.type === 'entreprise';
  const total = n * PRICE.unit;
  const method = METHODS.find((m) => m.key === f.method);
  const code = method ? method.ussd(total) : '';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  useEffect(() => { head.current?.focus(); }, [step]);

  const header = (sub, title) => (
    <>
      <p className="pr-12 text-sm font-extrabold text-brique">{sub}</p>
      <h3 ref={head} tabIndex={-1} className="pr-12 text-2xl font-extrabold outline-none">{title}</h3>
      <div className="mt-3 flex gap-1.5" aria-hidden="true">{[1, 2, 3].map((i) => <span key={i} className={`h-2 flex-1 rounded-full ${i <= step ? 'bg-brique' : 'bg-sable'}`} />)}</div>
    </>
  );
  const fieldErr = (m) => m && <p role="alert" className="mt-1 text-sm font-bold text-brique">{m}</p>;

  function next1(e) {
    e.preventDefault();
    const x = {};
    if (f.name.trim().length < 2) x.name = ent ? 'Entrez le nom de l’entreprise.' : 'Entrez votre nom et prénom(s).';
    if (!phoneOk(f.phone)) x.phone = 'Numéro invalide. Exemple : +226 70 00 00 00';
    setErrs(x); if (!Object.keys(x).length) setStep(2);
  }
  function next2(e) {
    e.preventDefault();
    const x = {};
    if (!f.method) x.method = 'Choisissez votre moyen de paiement.';
    setErrs(x); if (!Object.keys(x).length) { setCount(String(n)); setStep(3); }
  }
  async function copy() { try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2500); } catch {} }
  async function pay(e) {
    e.preventDefault(); setErr('');
    if (turnstileKey && !token) { setErr('Cochez d’abord la vérification anti-robot.'); return; }
    setBusy(true);
    try {
      const r = await fetch('/api/pledge', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: f.type, name: f.name, contact: f.contact, phone: normPhone(f.phone), children: n, method: f.method, anonymous: f.anonymous, turnstile: token }) });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Une erreur est survenue.');
      window.location.href = d.url;
    } catch (x) { setErr(x.message); setBusy(false); }
  }

  if (step === 1) return (
    <form onSubmit={next1} noValidate>
      {header('Étape 1 sur 3 · Vos informations', 'Parrainer un enfant')}
      <div className="mt-4 grid grid-cols-2 gap-2 rounded-2xl bg-sable p-1" role="radiogroup" aria-label="Type de profil">
        {[['particulier', 'Particulier'], ['entreprise', 'Entreprise / Institution']].map(([k, l]) => (
          <button type="button" key={k} role="radio" aria-checked={f.type === k} onClick={() => setF({ ...f, type: k })}
            className={`min-h-[48px] rounded-xl px-2 text-sm font-extrabold ${f.type === k ? 'bg-nuit text-white' : ''}`}>{l}</button>
        ))}
      </div>
      <label className="mt-4 block text-sm font-extrabold">{ent ? 'Raison sociale / Nom de l’entreprise' : 'Nom et prénom(s)'}
        <input className="field" autoFocus maxLength={120} autoComplete={ent ? 'organization' : 'name'} value={f.name} onChange={set('name')} /></label>
      {fieldErr(errs.name)}
      {ent && <label className="mt-4 block text-sm font-extrabold">Nom du contact référent (facultatif)
        <input className="field" maxLength={120} value={f.contact} onChange={set('contact')} /></label>}
      <label className="mt-4 block text-sm font-extrabold">Téléphone (celui qui effectuera le paiement)
        <input className="field" type="tel" inputMode="tel" autoComplete="tel" placeholder="+226 XX XX XX XX" value={f.phone} onChange={set('phone')} /></label>
      {fieldErr(errs.phone)}
      <button className="btn mt-6 w-full">Continuer</button>
    </form>
  );

  if (step === 2) return (
    <form onSubmit={next2} noValidate>
      {header('Étape 2 sur 3 · Votre parrainage et votre paiement', 'Combien d’enfants parrainez-vous ?')}
      <fieldset className="mt-4"><legend className="text-sm font-extrabold">Nombre d’enfants à parrainer</legend>
        <div className="mt-2 flex items-center gap-3">
          <button type="button" aria-label="Moins" className="h-12 w-12 rounded-full bg-sable text-2xl font-extrabold" onClick={() => setCount(String(Math.max(1, n - 1)))}>−</button>
          <input aria-label="Nombre d’enfants" className="field !mt-0 text-center text-xl" inputMode="numeric" value={count} onChange={(e) => setCount(e.target.value.replace(/\D/g, '').slice(0, 4))} onBlur={() => setCount(String(n))} />
          <button type="button" aria-label="Plus" className="h-12 w-12 rounded-full bg-sable text-2xl font-extrabold" onClick={() => setCount(String(Math.min(MAX_CHILDREN, n + 1)))}>+</button>
        </div>
        <div className="mt-3 rounded-2xl bg-nuit p-4 text-white" aria-live="polite">
          <div className="flex items-baseline justify-between"><span className="text-sm text-sable">Total à payer</span><span className="text-2xl font-extrabold">{fmt(total)} FCFA</span></div>
          <p className="mt-2 text-sm text-sable">{n} × (1 tee-shirt, 1 repas chaud + boisson, 1 jouet) · {fmt(PRICE.unit)} FCFA par enfant</p>
        </div>
      </fieldset>
      <fieldset className="mt-5"><legend className="text-sm font-extrabold">Moyen de paiement</legend>
        <div className="mt-2 grid grid-cols-2 gap-3">
          {METHODS.map((m) => {
            const on = f.method === m.key;
            return (
              <label key={m.key} className="block cursor-pointer">
                <input className="peer sr-only" type="radio" name="method" checked={on} onChange={() => setF({ ...f, method: m.key })} />
                <span className="flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border-[3px] px-2 text-center text-base font-extrabold shadow-sm transition peer-focus-visible:outline peer-focus-visible:outline-[3px] peer-focus-visible:outline-offset-2 peer-focus-visible:outline-nuit"
                  style={on ? { background: m.color, borderColor: m.color, color: m.text } : { background: '#fff', borderColor: m.color, color: '#1B2A24' }}>
                  <span className="h-3.5 w-3.5 rounded-full border-2" style={{ background: on ? m.text : m.color, borderColor: on ? m.text : m.color }} aria-hidden="true" />
                  {m.label}
                </span>
              </label>
            );
          })}
        </div>
        {fieldErr(errs.method)}
      </fieldset>
      <div className="mt-6 grid grid-cols-2 gap-3">
        <button type="button" className="btn btn-ghost" onClick={() => setStep(1)}>Retour</button>
        <button className="btn">Continuer</button>
      </div>
    </form>
  );

  return (
    <form onSubmit={pay}>
      {header('Étape 3 sur 3 · Paiement et confirmation', 'Dernière étape : payez')}
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 rounded-2xl bg-creme p-4 text-sm">
        <dt className="font-bold">Parrain</dt><dd>{f.name}</dd>
        <dt className="font-bold">Téléphone</dt><dd>{pretty(f.phone)}</dd>
        <dt className="font-bold">Enfants</dt><dd>{n}</dd>
        <dt className="font-bold">Total à payer</dt><dd className="font-extrabold">{fmt(total)} FCFA</dd>
      </dl>
      <button type="button" className="mt-2 text-sm font-bold underline" onClick={() => setStep(1)}>Modifier mes informations</button>

      <div className="mt-4 overflow-hidden rounded-2xl border-[3px]" style={{ borderColor: method.color }}>
        <p className="px-4 py-2 text-sm font-extrabold" style={{ background: method.color, color: method.text }}>Payer avec {method.label}</p>
        <div className="p-4">
          <p className="text-sm font-bold">Composez ce code sur votre téléphone :</p>
          <p className="mt-2 break-all rounded-xl bg-creme p-3 text-center font-mono text-xl font-bold tracking-wide" data-testid="ussd">{code}</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <a className="btn btn-ghost" href={`tel:${encodeURIComponent(code)}`}>Composer</a>
            <button type="button" className="btn btn-ghost" onClick={copy}>{copied ? 'Code copié' : 'Copier le code'}</button>
          </div>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
            <li>Composez ce code (ou collez-le dans l’application Téléphone).</li>
            <li>Confirmez avec votre code secret {method.label}.</li>
            <li>Revenez ici et appuyez sur « J’ai effectué le paiement ».</li>
          </ol>
        </div>
      </div>

      <label className="mt-5 flex cursor-pointer items-start gap-3 text-sm font-bold">
        <input type="checkbox" className="mt-0.5 h-5 w-5 accent-brique" checked={f.anonymous} onChange={(e) => setF({ ...f, anonymous: e.target.checked })} />
        <span>Rester anonyme sur la liste publique des parrains <span className="block font-medium text-nuit/70">Votre identité reste enregistrée pour l’organisation.</span></span>
      </label>
      <p className="mt-4 rounded-2xl bg-sable p-3 text-sm font-bold">Votre parrainage est enregistré dès que vous appuyez sur « J’ai effectué le paiement ». L’organisation contrôle ensuite les paiements reçus.</p>

      <Turnstile siteKey={turnstileKey} onToken={setToken} />
      {err && <p role="alert" className="mt-4 rounded-xl bg-sable p-3 text-sm font-bold">{err}</p>}
      <div className="mt-5 grid grid-cols-[auto_1fr] gap-3">
        <button type="button" className="btn btn-ghost !px-5" onClick={() => setStep(2)}>Retour</button>
        <button className="btn" disabled={busy}>{busy ? 'Enregistrement…' : 'J’ai effectué le paiement'}</button>
      </div>
    </form>
  );
}
