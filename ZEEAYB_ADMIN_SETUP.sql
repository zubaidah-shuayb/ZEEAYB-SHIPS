-- =====================================================================
-- ZEEAYB — Admin Operations Console setup
-- Run this AFTER ZEEAYB_SUPABASE_SETUP.sql, in the Supabase SQL Editor.
-- It is idempotent, preserves existing users, and makes NOBODY an admin.
--
-- HOW TO PROMOTE THE ADMIN
--   1. In Supabase Dashboard → Authentication → Users → "Add user",
--      create the account zubaidahshuayb000@gmail.com and choose your own
--      password (never share it, never store it anywhere else).
--   2. Run this whole script.
--   3. Run the single UPDATE at the very bottom of this file (section 9).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Role enum + profiles.role column (defaults every user to customer)
-- ---------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type public.user_role as enum ('customer','admin');
  end if;
end$$;

alter table public.profiles
  add column if not exists role public.user_role not null default 'customer';

-- Existing rows keep working: they are backfilled as customers.
update public.profiles set role = 'customer' where role is null;

-- ---------------------------------------------------------------------
-- 2. Signup trigger — new users are ALWAYS customers.
--    Role is never taken from client-supplied user metadata.
-- ---------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, new.raw_user_meta_data->>'full_name', new.email, 'customer')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- ---------------------------------------------------------------------
-- 3. Security-definer role check (no RLS recursion on profiles)
-- ---------------------------------------------------------------------
create or replace function public.is_admin(_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = _user_id and p.role = 'admin'
  );
$$;

revoke all on function public.is_admin(uuid) from public;
grant execute on function public.is_admin(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 4. Privilege-escalation guard.
--    Customers may update their own profile, but NOT their role.
--    This is enforced in the database, not in the frontend.
-- ---------------------------------------------------------------------
create or replace function public.guard_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  is_initial_admin_target boolean := false;
  is_sql_editor_provisioning boolean := false;
begin
  if new.role is distinct from old.role then
    -- Existing administrators may manage roles through authenticated,
    -- RLS-protected application flows.
    if public.is_admin(auth.uid()) then
      return new;
    end if;

    -- Initial provisioning is intentionally much narrower than an ordinary
    -- role update. It must come from a privileged SQL Editor session, opt in
    -- for this transaction only, change customer -> admin, and target the
    -- one authorized Auth account. Data API sessions use `authenticator` as
    -- session_user and can never satisfy this branch.
    is_sql_editor_provisioning :=
      session_user in ('postgres', 'supabase_admin')
      and coalesce(current_setting('zeeayb.admin_provisioning', true), '') = 'on';

    if is_sql_editor_provisioning
       and old.role = 'customer'::public.user_role
       and new.role = 'admin'::public.user_role then
      select exists (
        select 1
        from auth.users u
        where u.id = new.id
          and lower(u.email) = 'zubaidahshuayb000@gmail.com'
      ) into is_initial_admin_target;
    end if;

    if not is_initial_admin_target then
      raise exception 'Not authorized to change role';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role on public.profiles;
create trigger profiles_guard_role
  before update on public.profiles
  for each row execute function public.guard_profile_role();

-- Inserts from the client must never claim a role other than customer.
create or replace function public.guard_profile_role_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from 'customer'::public.user_role and not public.is_admin(auth.uid()) then
    new.role := 'customer';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_role_insert on public.profiles;
create trigger profiles_guard_role_insert
  before insert on public.profiles
  for each row execute function public.guard_profile_role_insert();

-- ---------------------------------------------------------------------
-- 5. Lightweight audit trail: who created a movement event
-- ---------------------------------------------------------------------
alter table public.shipment_events
  add column if not exists created_by uuid references auth.users(id) on delete set null;

create index if not exists shipment_events_created_by_idx
  on public.shipment_events (created_by);

-- ---------------------------------------------------------------------
-- 6. Admin RLS policies — ADDED alongside the existing customer policies.
--    Customer policies from the base script are left untouched.
-- ---------------------------------------------------------------------

-- profiles: admins can read every profile (customers list) and update roles
drop policy if exists "Admins can view all profiles" on public.profiles;
create policy "Admins can view all profiles"
  on public.profiles for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update any profile" on public.profiles;
create policy "Admins can update any profile"
  on public.profiles for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- shipments: admins can read and update everything
drop policy if exists "Admins can view all shipments" on public.shipments;
create policy "Admins can view all shipments"
  on public.shipments for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can update all shipments" on public.shipments;
create policy "Admins can update all shipments"
  on public.shipments for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- shipment_events: admins can read all and record new movement events
drop policy if exists "Admins can view all shipment events" on public.shipment_events;
create policy "Admins can view all shipment events"
  on public.shipment_events for select to authenticated
  using (public.is_admin());

drop policy if exists "Admins can add shipment events" on public.shipment_events;
create policy "Admins can add shipment events"
  on public.shipment_events for insert to authenticated
  with check (public.is_admin() and (created_by is null or created_by = auth.uid()));

-- ---------------------------------------------------------------------
-- 7. Grants (RLS still applies on top of these)
-- ---------------------------------------------------------------------
grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.shipments to authenticated;
grant select, insert on public.shipment_events to authenticated;
grant all on public.profiles, public.shipments, public.shipment_events to service_role;

-- ---------------------------------------------------------------------
-- 8. Make sure the admin has a profile row even if they were created
--    through the dashboard before the signup trigger existed.
-- ---------------------------------------------------------------------
insert into public.profiles (id, email, full_name, role)
select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', 'ZEEAYB Operations'), 'customer'
from auth.users u
where u.email = 'zubaidahshuayb000@gmail.com'
on conflict (id) do nothing;

-- =====================================================================
-- 9. PROMOTE THE SINGLE AUTHORIZED ADMINISTRATOR
--    Run this after creating the Auth account. The provisioning flag is
--    transaction-local, and the trigger accepts it only from a privileged
--    SQL Editor session for this exact Auth email and customer -> admin.
-- =====================================================================
begin;

select set_config('zeeayb.admin_provisioning', 'on', true);

update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and lower(u.email) = 'zubaidahshuayb000@gmail.com'
  and p.role = 'customer'::public.user_role;

commit;

-- Verify:
-- select p.id, p.email, p.role from public.profiles p where p.role = 'admin';
-- =====================================================================
