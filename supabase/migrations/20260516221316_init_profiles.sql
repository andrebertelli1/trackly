-- Trackly · initial schema (auth + profiles only)
-- Idempotent: safe to re-run.

-- 1. user_role enum (Postgres has no "create type if not exists").
do $$ begin
  create type public.user_role as enum ('parent', 'driver', 'admin');
exception
  when duplicate_object then null;
end $$;

-- 2. Profiles: 1:1 with auth.users.
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'parent',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 3. RLS: a user can read/update only their own row.
drop policy if exists "profile_select_own" on public.profiles;
create policy "profile_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profile_update_own" on public.profiles;
create policy "profile_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- 4. Auto-create a profile row on signup, copying full_name + phone from metadata.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone)
  values (
    new.id,
    nullif(new.raw_user_meta_data->>'full_name', ''),
    nullif(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
