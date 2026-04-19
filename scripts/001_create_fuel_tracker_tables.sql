-- Fuel Tracker schema
-- Creates vehicles and fuel_entries tables with Row Level Security

-- =============================================================
-- Table: vehicles
-- =============================================================
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  make text,
  model text,
  year integer,
  plate text,
  initial_odometer numeric(10, 1) default 0,
  monthly_budget numeric(10, 2),
  is_default boolean default false,
  created_at timestamptz default now()
);

alter table public.vehicles enable row level security;

drop policy if exists "vehicles_select_own" on public.vehicles;
drop policy if exists "vehicles_insert_own" on public.vehicles;
drop policy if exists "vehicles_update_own" on public.vehicles;
drop policy if exists "vehicles_delete_own" on public.vehicles;

create policy "vehicles_select_own" on public.vehicles
  for select using (auth.uid() = user_id);
create policy "vehicles_insert_own" on public.vehicles
  for insert with check (auth.uid() = user_id);
create policy "vehicles_update_own" on public.vehicles
  for update using (auth.uid() = user_id);
create policy "vehicles_delete_own" on public.vehicles
  for delete using (auth.uid() = user_id);

-- =============================================================
-- Table: fuel_entries
-- =============================================================
create table if not exists public.fuel_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  entry_date date not null default current_date,
  fuel_type text not null check (fuel_type in ('gasolina', 'etanol', 'gnv', 'diesel')),
  station_name text,
  price_per_liter numeric(10, 3) not null,
  liters numeric(10, 3) not null,
  total_amount numeric(10, 2) not null,
  odometer numeric(10, 1) not null,
  full_tank boolean default true,
  notes text,
  created_at timestamptz default now()
);

create index if not exists fuel_entries_user_vehicle_idx
  on public.fuel_entries (user_id, vehicle_id, entry_date desc);

alter table public.fuel_entries enable row level security;

drop policy if exists "fuel_entries_select_own" on public.fuel_entries;
drop policy if exists "fuel_entries_insert_own" on public.fuel_entries;
drop policy if exists "fuel_entries_update_own" on public.fuel_entries;
drop policy if exists "fuel_entries_delete_own" on public.fuel_entries;

create policy "fuel_entries_select_own" on public.fuel_entries
  for select using (auth.uid() = user_id);
create policy "fuel_entries_insert_own" on public.fuel_entries
  for insert with check (auth.uid() = user_id);
create policy "fuel_entries_update_own" on public.fuel_entries
  for update using (auth.uid() = user_id);
create policy "fuel_entries_delete_own" on public.fuel_entries
  for delete using (auth.uid() = user_id);
