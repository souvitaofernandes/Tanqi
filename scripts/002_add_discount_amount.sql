-- Fuel Tracker: add optional coupon/discount amount to fuel entries.
-- Keeps price_per_liter and total_amount as the posted values from the station,
-- while discount_amount captures the coupon applied at checkout.
-- The "effective" total paid by the user is total_amount - discount_amount.
alter table public.fuel_entries
  add column if not exists discount_amount numeric(10, 2) not null default 0;

alter table public.fuel_entries
  drop constraint if exists fuel_entries_discount_valid;

alter table public.fuel_entries
  add constraint fuel_entries_discount_valid
  check (discount_amount >= 0 and discount_amount <= total_amount);
