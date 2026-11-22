-- Travel Qila customer flight bookings and saved itineraries.
-- Apply in Supabase SQL Editor. Safe to re-run after the original flight_bookings table exists.

create table if not exists public.flight_bookings (
    id uuid primary key default gen_random_uuid(),
    booking_reference text not null unique default ('TQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))),
    user_id uuid not null references auth.users(id) on delete cascade,
    origin text not null check (char_length(origin) between 2 and 120),
    destination text not null check (char_length(destination) between 2 and 120),
    origin_code text check (origin_code is null or origin_code ~ '^[A-Z]{3}$'),
    destination_code text check (destination_code is null or destination_code ~ '^[A-Z]{3}$'),
    trip_type text not null check (trip_type in ('Round trip','One way')),
    departure_date date not null,
    return_date date,
    adults integer not null default 1 check (adults between 1 and 9),
    children integer not null default 0 check (children between 0 and 6),
    infants integer not null default 0 check (infants between 0 and 6),
    cabin_class text not null default 'Economy' check (cabin_class in ('Economy','Premium Economy','Business','First Class')),
    airline text not null check (char_length(airline) between 2 and 80),
    flight_number text not null check (char_length(flight_number) between 2 and 20),
    departure_time text not null check (departure_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    arrival_time text not null check (arrival_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    return_airline text,
    return_flight_number text,
    return_departure_time text,
    return_arrival_time text,
    base_fare numeric(12,2) not null default 0 check (base_fare >= 0),
    tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
    demo_fare numeric(12,2) not null check (demo_fare >= 0),
    status text not null default 'pending_confirmation' check (status in ('pending_confirmation','confirmed','cancelled')),
    created_at timestamptz not null default now(),
    constraint flight_bookings_different_cities check (lower(origin) <> lower(destination)),
    constraint flight_bookings_return_date check (
      (trip_type = 'One way' and return_date is null and return_airline is null and return_flight_number is null and return_departure_time is null and return_arrival_time is null)
      or
      (trip_type = 'Round trip' and return_date is not null and return_date >= departure_date and return_airline is not null and return_flight_number is not null and return_departure_time is not null and return_arrival_time is not null)
    ),
    constraint flight_bookings_infant_adult_count check (infants <= adults)
);

-- Add new itinerary fields to installations created with the earlier flight request schema.
alter table public.flight_bookings add column if not exists return_airline text;
alter table public.flight_bookings add column if not exists return_flight_number text;
alter table public.flight_bookings add column if not exists return_departure_time text;
alter table public.flight_bookings add column if not exists return_arrival_time text;
alter table public.flight_bookings add column if not exists base_fare numeric(12,2) not null default 0;
alter table public.flight_bookings add column if not exists tax_amount numeric(12,2) not null default 0;

-- Require a complete return leg on new round-trip requests, without rejecting legacy rows.
do $
begin
  if not exists (select 1 from pg_constraint where conname = 'flight_bookings_return_leg_required') then
    alter table public.flight_bookings add constraint flight_bookings_return_leg_required check (
      (trip_type = 'One way' and return_airline is null and return_flight_number is null and return_departure_time is null and return_arrival_time is null)
      or
      (trip_type = 'Round trip' and return_date is not null and return_airline is not null and return_flight_number is not null and return_departure_time is not null and return_arrival_time is not null)
    ) not valid;
  end if;
end $;

-- Saved itineraries are snapshots, not confirmed reservations or live fare guarantees.
create table if not exists public.flight_wishlists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null check (char_length(title) between 2 and 160),
    itinerary jsonb not null check (jsonb_typeof(itinerary) = 'object'),
    created_at timestamptz not null default now()
);
create index if not exists flight_bookings_user_created_idx on public.flight_bookings(user_id, created_at desc);
create index if not exists flight_wishlists_user_created_idx on public.flight_wishlists(user_id, created_at desc);

alter table public.flight_bookings enable row level security;
alter table public.flight_wishlists enable row level security;

drop policy if exists "Customers can read their own flight bookings" on public.flight_bookings;
create policy "Customers can read their own flight bookings" on public.flight_bookings for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Customers can create their own flight booking requests" on public.flight_bookings;
create policy "Customers can create their own flight booking requests" on public.flight_bookings for insert to authenticated with check ((select auth.uid()) = user_id);

drop policy if exists "Customers can read their own saved flights" on public.flight_wishlists;
create policy "Customers can read their own saved flights" on public.flight_wishlists for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "Customers can save their own flights" on public.flight_wishlists;
create policy "Customers can save their own flights" on public.flight_wishlists for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "Customers can remove their own saved flights" on public.flight_wishlists;
create policy "Customers can remove their own saved flights" on public.flight_wishlists for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.flight_bookings from anon, authenticated;
grant select on public.flight_bookings to authenticated;
grant insert (user_id,origin,destination,origin_code,destination_code,trip_type,departure_date,return_date,adults,children,infants,cabin_class,airline,flight_number,departure_time,arrival_time,return_airline,return_flight_number,return_departure_time,return_arrival_time,base_fare,tax_amount,demo_fare) on public.flight_bookings to authenticated;

revoke all on public.flight_wishlists from anon, authenticated;
grant select, delete on public.flight_wishlists to authenticated;
grant insert (user_id,title,itinerary) on public.flight_wishlists to authenticated;

-- Customers cannot change booking status or modify an existing saved itinerary through the browser.
-- Ticket confirmation, cancellation and live fare revalidation require trusted server-side integrations.
