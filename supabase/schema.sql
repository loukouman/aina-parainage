-- Base PostgreSQL (ACID). À exécuter dans l'éditeur SQL de Supabase.
create table if not exists pledges (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique,
  created_at timestamptz not null default now(),
  donor_type text not null check (donor_type in ('particulier','entreprise')),
  donor_name text not null,
  contact_name text,
  phone text not null,
  anonymous boolean not null default false,
  children integer not null check (children >= 1),
  amount_expected integer not null check (amount_expected = children * 7500),
  amount_paid integer,
  method text not null check (method in ('orange','moov','wave')),
  status text not null default 'pending' check (status in ('pending','validated','failed')),
  fail_reason text,
  provider_tx_id text,
  paid_at timestamptz
);
-- Idempotence : un identifiant de transaction opérateur ne peut être compté qu'une fois.
create unique index if not exists pledges_tx_unique on pledges (provider_tx_id) where provider_tx_id is not null;
create index if not exists pledges_status_idx on pledges (status, paid_at desc);

create table if not exists audit_log (
  id bigserial primary key, at timestamptz not null default now(),
  actor text not null, action text not null, ref text, details jsonb not null default '{}'
);
create or replace function forbid_change() returns trigger language plpgsql as $$
begin raise exception 'audit_log est immuable'; end $$;
drop trigger if exists audit_immutable on audit_log;
create trigger audit_immutable before update or delete on audit_log for each row execute function forbid_change();

create table if not exists attempts (k text not null, at timestamptz not null default now());
create index if not exists attempts_idx on attempts (k, at);

create table if not exists admin_users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  password_hash text not null,
  totp_secret text,
  created_at timestamptz not null default now()
);

-- Codes de connexion de l'administration (envoyés par e-mail, 10 minutes, usage unique).
create table if not exists admin_links (
  token_hash text primary key, email text not null, expires_at timestamptz not null
);

alter table pledges enable row level security;
alter table audit_log enable row level security;
alter table attempts enable row level security;
alter table admin_users enable row level security;
alter table admin_links enable row level security;
-- Aucune politique : seul le serveur (clé secrète) accède aux données.

create or replace function apply_payment(p_ref text, p_tx text, p_status text, p_amount integer)
returns text language plpgsql as $$
declare r pledges%rowtype;
begin
  select * into r from pledges where ref = p_ref for update;
  if not found then return 'unknown_ref'; end if;
  if r.status = 'validated' then return 'duplicate'; end if;
  if p_status = 'SUCCESS' then
    if p_amount is distinct from r.amount_expected then
      update pledges set status = 'failed', fail_reason = 'montant_different' where id = r.id;
      return 'amount_mismatch';
    end if;
    begin
      update pledges set status = 'validated', amount_paid = p_amount, provider_tx_id = p_tx, paid_at = now() where id = r.id;
    exception when unique_violation then return 'duplicate_tx';
    end;
    return 'validated';
  end if;
  update pledges set status = 'failed', fail_reason = lower(p_status) where id = r.id;
  return 'failed';
end $$;

create or replace function public_stats() returns json language sql stable as $$
  select json_build_object(
    'children', coalesce(sum(children), 0),
    'sponsors', count(*),
    'recent', coalesce((select json_agg(x) from (
       select case when anonymous then 'Anonyme' else donor_name end as name, children
       from pledges where status = 'validated' order by paid_at desc limit 12) x), '[]'::json))
  from pledges where status = 'validated';
$$;

revoke all on function apply_payment(text,text,text,integer) from public, anon, authenticated;
revoke all on function public_stats() from public, anon, authenticated;

-- Réglages modifiables depuis l'administration (page « Calendrier » : dates d'ouverture et de fermeture).
create table if not exists settings (key text primary key, value text not null);
alter table settings enable row level security;
