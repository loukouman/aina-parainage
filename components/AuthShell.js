import Garland from './Garland';
import Sapin from './Sapin';
import AinaLogo from './AinaLogo';
import { Icon } from './AuthIcons';
import { adminBase } from '@/lib/auth';

// Cadre commun des pages de connexion et de création de compte de l'administration.
export default function AuthShell({ children }) {
  return (
    <main className="grid min-h-[100dvh] lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative flex flex-col overflow-hidden bg-nuit text-white lg:sticky lg:top-0 lg:h-[100dvh] lg:self-start">
        <Garland className="relative z-10" />
        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 pb-8 pt-1 text-center lg:px-12 lg:pb-24">
          <AinaLogo className="!text-sable text-[72px] sm:text-[92px] lg:text-[124px]" />
          <p className="mt-1 text-lg font-semibold text-sable lg:text-xl">Espace administration</p>
          <p className="mt-1 text-sm text-white/70">Ma Fête à Karpala · 2ᵉ édition</p>
          <ul className="mt-9 hidden space-y-3.5 text-left text-[15px] text-white/90 lg:block">
            {['Suivre les parrainages en direct', 'Valider et vérifier les paiements', 'Exporter les données en Excel'].map((t) => (
              <li key={t} className="flex items-center gap-3"><Icon name="check" className="shrink-0 text-soleil" />{t}</li>
            ))}
          </ul>
        </div>
        <Sapin className="absolute bottom-0 left-3 hidden w-28 lg:block xl:w-36" />
        <Sapin swap className="absolute bottom-0 right-3 hidden w-28 lg:block xl:w-36" />
      </aside>
      <section className="flex items-center justify-center bg-creme px-4 py-8 sm:px-8 lg:py-5">
        <div className="w-full max-w-[440px]">{children}</div>
      </section>
    </main>
  );
}

export function Tabs({ active }) {
  const b = adminBase();
  const on = 'bg-white text-nuit shadow-sm';
  const off = 'text-nuit/70 hover:text-nuit';
  return (
    <nav aria-label="Connexion ou création de compte" className="grid grid-cols-2 rounded-full bg-sable p-1 text-sm font-bold">
      <a href={`${b}/login`} aria-current={active === 'login' ? 'page' : undefined} className={`rounded-full px-4 py-2 text-center transition ${active === 'login' ? on : off}`}>Connexion</a>
      <a href={`${b}/inscription`} aria-current={active === 'signup' ? 'page' : undefined} className={`rounded-full px-4 py-2 text-center transition ${active === 'signup' ? on : off}`}>Créer un compte</a>
    </nav>
  );
}

const KIND = { err: 'border-red-300 bg-red-50 text-red-800', ok: 'border-emerald-300 bg-emerald-50 text-emerald-900', info: 'border-amber-300 bg-amber-50 text-amber-900' };
export function Alert({ kind = 'err', children }) {
  return <p role={kind === 'err' ? 'alert' : 'status'} className={`mt-4 rounded-xl border px-3.5 py-2.5 text-sm font-semibold ${KIND[kind]}`}>{children}</p>;
}

export function Field({ label, icon, hint, ...input }) {
  return (
    <label className="mt-4 block text-sm font-bold">{label}
      <div className="relative mt-1.5">
        {icon && <Icon name={icon} size={19} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-nuit/50" />}
        <input className={`field !mt-0 ${icon ? '!pl-11' : ''}`} {...input} />
      </div>
      {hint && <span className="a-muted mt-1 block text-xs font-normal">{hint}</span>}
    </label>
  );
}
