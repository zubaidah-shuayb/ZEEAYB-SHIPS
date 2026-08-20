-- =====================================================================
-- ZEEAYB Supabase Database Setup
-- Run this whole script in the Supabase SQL Editor. It is idempotent.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'shipment_status') then
    create type public.shipment_status as enum (
      'pending','created','picked_up','in_transit','out_for_delivery','delivered','cancelled'
    );
  end if;
end$$;

-- ---------------------------------------------------------------------
-- 2. Shared trigger function: keeps updated_at fresh
-- ---------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;

alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select to authenticated
  using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
  on public.profiles for insert to authenticated
  with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated
  using (auth.uid() = id) with check (auth.uid() = id);

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile whenever a new auth user signs up
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- 4. shipments
-- ---------------------------------------------------------------------
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tracking_number text not null unique,

  sender_name text not null,
  sender_phone text,
  sender_address text,
  sender_city text not null,
  sender_country text not null,

  recipient_name text not null,
  recipient_phone text,
  recipient_address text,
  recipient_city text not null,
  recipient_country text not null,

  package_type text not null,
  package_weight numeric(10,2) not null default 0 check (package_weight >= 0),
  package_length numeric(10,2),
  package_width numeric(10,2),
  package_height numeric(10,2),

  shipping_method text not null default 'standard'
    check (shipping_method in ('standard','express')),
  price numeric(10,2) not null default 0 check (price >= 0),
  status public.shipment_status not null default 'created',
  estimated_delivery timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists shipments_user_id_idx on public.shipments (user_id);
create index if not exists shipments_tracking_number_idx on public.shipments (tracking_number);
create index if not exists shipments_status_idx on public.shipments (status);

grant select, insert, update on public.shipments to authenticated;
grant all on public.shipments to service_role;

alter table public.shipments enable row level security;

drop policy if exists "Users can view their own shipments" on public.shipments;
create policy "Users can view their own shipments"
  on public.shipments for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own shipments" on public.shipments;
create policy "Users can create their own shipments"
  on public.shipments for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own shipments" on public.shipments;
create policy "Users can update their own shipments"
  on public.shipments for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists shipments_set_updated_at on public.shipments;
create trigger shipments_set_updated_at
  before update on public.shipments
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- 5. shipment_events
-- ---------------------------------------------------------------------
create table if not exists public.shipment_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  status public.shipment_status not null,
  location text,
  description text,
  created_at timestamptz not null default now()
);

create index if not exists shipment_events_shipment_id_idx on public.shipment_events (shipment_id);

grant select, insert on public.shipment_events to authenticated;
grant all on public.shipment_events to service_role;

alter table public.shipment_events enable row level security;

drop policy if exists "Users can view events for their own shipments" on public.shipment_events;
create policy "Users can view events for their own shipments"
  on public.shipment_events for select to authenticated
  using (exists (
    select 1 from public.shipments s
    where s.id = shipment_events.shipment_id and s.user_id = auth.uid()
  ));

drop policy if exists "Users can add events to their own shipments" on public.shipment_events;
create policy "Users can add events to their own shipments"
  on public.shipment_events for insert to authenticated
  with check (exists (
    select 1 from public.shipments s
    where s.id = shipment_events.shipment_id and s.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------
-- 6. Public tracking (enumeration-safe)
--    Anonymous visitors never read the shipments table directly, and there is
--    no public listing endpoint. Tracking goes through security-definer
--    functions that REQUIRE an exact tracking number and return only
--    non-sensitive fields: no names, phone numbers or street addresses.
-- ---------------------------------------------------------------------
create or replace function public.get_public_tracking(p_tracking_number text)
returns table (
  tracking_number text,
  status public.shipment_status,
  origin_city text,
  origin_country text,
  destination_city text,
  destination_country text,
  shipping_method text,
  estimated_delivery timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.tracking_number,
    s.status,
    s.sender_city,
    s.sender_country,
    s.recipient_city,
    s.recipient_country,
    s.shipping_method,
    s.estimated_delivery,
    s.created_at
  from public.shipments s
  where s.tracking_number = upper(trim(p_tracking_number))
  limit 1;
$$;

create or replace function public.get_public_tracking_events(p_tracking_number text)
returns table (
  id uuid,
  status public.shipment_status,
  location text,
  description text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select e.id, e.status, e.location, e.description, e.created_at
  from public.shipment_events e
  join public.shipments s on s.id = e.shipment_id
  where s.tracking_number = upper(trim(p_tracking_number))
  order by e.created_at asc;
$$;

revoke all on function public.get_public_tracking(text) from public;
revoke all on function public.get_public_tracking_events(text) from public;
grant execute on function public.get_public_tracking(text) to anon, authenticated;
grant execute on function public.get_public_tracking_events(text) to anon, authenticated;

-- =====================================================================
-- Done. ZEEAYB database is ready.
-- =====================================================================
