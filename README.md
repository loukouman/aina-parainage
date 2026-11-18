# AÏNA – Plateforme de parrainage solidaire (Ma Fête à Karpala, 2ᵉ édition)

Next.js 14 + Tailwind + PostgreSQL (Supabase). 7 500 FCFA par enfant : jouet 3 500, repas 2 500, tee-shirt 1 500.

## Installation
1. `npm install`
2. Créez un projet Supabase et exécutez `supabase/schema.sql` dans le SQL Editor.
3. `cp .env.example .env.local` puis remplissez : `APP_SECRET` (`openssl rand -hex 32`), `SUPABASE_URL` (…supabase.co, sans rien après), `SUPABASE_SERVICE_ROLE_KEY` (clé secrète `sb_secret_…`).
4. Créez un administrateur : `npm run create-admin -- email@exemple.com 'mot-de-passe-12-caracteres-min'` (la même commande change le mot de passe).
5. `npm run dev` → site : http://localhost:3000 · administration : http://localhost:3000/admin

## Connexion à l'administration
Mot de passe, puis code à 6 chiffres envoyé par e-mail (valable 10 minutes, usage unique). En développement sans `RESEND_API_KEY`, le code s'affiche dans le terminal. En production, la clé Resend et un domaine vérifié sont obligatoires.

## Calendrier
Avant `OPEN_AT` : page d'attente. Entre `OPEN_AT` et `CLOSE_AT` : parrainages ouverts. Ensuite : clôture avec bilan. Pour tester, changez `OPEN_AT` (par exemple 2026-11-01T00:00:00Z), puis remettez 2026-11-20T00:00:00Z.

## Paiement
`PAYMENT_PROVIDER=sandbox` active un simulateur (succès, échec, annulation). Ne jamais le laisser en production. Pour le vrai paiement, complétez `lib/payment.js` (createCheckout et parseWebhook) avec la documentation de l'agrégateur retenu, puis renseignez PAYMENT_API_KEY, PAYMENT_WEBHOOK_SECRET et PAYMENT_IP_WHITELIST.

## Mise en ligne
Hébergeur Node.js (par exemple Vercel), toutes les variables d'environnement, nouveaux secrets, Turnstile (anti-robot), Resend avec domaine vérifié, sauvegardes Supabase, pare-feu Cloudflare. Voir le document de projet pour la procédure complète.

## Version mobile (PWA)
Le service worker ne s'active qu'en production (`npm run build` puis `npm run start`) et l'installation sur téléphone demande une adresse HTTPS.
