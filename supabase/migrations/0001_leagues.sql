-- Liga de Catán: tabla de ligas (multi-tenant).
-- Ejecutar en el SQL Editor de Supabase o con `supabase db push`.
create extension if not exists pgcrypto;

create table if not exists public.leagues (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,
  name        text not null,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  data        jsonb not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists leagues_created_at_idx on public.leagues (created_at desc);

alter table public.leagues enable row level security;

-- Lectura pública: galería de la homepage y vistas por código de liga.
drop policy if exists "leagues_select_public" on public.leagues;
create policy "leagues_select_public" on public.leagues
  for select using (true);

-- Escritura exclusiva del propietario (red de seguridad; la app gatea en las server actions).
drop policy if exists "leagues_insert_owner" on public.leagues;
create policy "leagues_insert_owner" on public.leagues
  for insert with check (auth.uid() = owner_id);

drop policy if exists "leagues_update_owner" on public.leagues;
create policy "leagues_update_owner" on public.leagues
  for update using (auth.uid() = owner_id);

drop policy if exists "leagues_delete_owner" on public.leagues;
create policy "leagues_delete_owner" on public.leagues
  for delete using (auth.uid() = owner_id);
