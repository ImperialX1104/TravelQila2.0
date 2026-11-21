-- Travel Qila flight booking requests.
-- Run in Supabase Dashboard > SQL Editor before enabling customer booking requests.
-- A customer can create and read only their own requests. Customers cannot self-mark requests as confirmed.

create table if not exists public.flight_bookings (
    id uuid primary key default gen_random_uuid(),
    booking_reference text not null unique default (
        'TQ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
    ),
    user_id uuid not null references auth.users (id) on delete cascade,
    origin text not null check (char_length(origin) between 2 and 120),
    destination text not null check (char_length(destination) between 2 and 120),
    origin_code text check (origin_code is null or origin_code ~ '^[A-Z]{3}$'),
    destination_code text check (destination_code is null or destination_code ~ '^[A-Z]{3}$'),
    trip_type text not null check (trip_type in ('Round trip', 'One way')),
    departure_date date not null,
    return_date date,
    adults integer not null default 1 check (adults between 1 and 9),
    children integer not null default 0 check (children between 0 and 6),
    infants integer not null default 0 check (infants between 0 and 6),
    cabin_class text not null default 'Economy'
        check (cabin_class in ('Economy', 'Premium Economy', 'Business', 'First Class')),
    airline text not null check (char_length(airline) between 2 and 80),
    flight_number text not null check (char_length(flight_number) between 2 and 20),
    departure_time text not null check (departure_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    arrival_time text not null check (arrival_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]
    status text not null default 'pending_confirmation'
        check (status in ('pending_confirmation', 'confirmed', 'cancelled')),
    created_at timestamptz not null default now(),
    constraint flight_bookings_different_cities check (
        lower(origin) <> lower(destination)
    ),
    constraint flight_bookings_return_date check (
        (trip_type = 'One way' and return_date is null)
        or (trip_type = 'Round trip' and return_date is not null and return_date >= departure_date)
    ),
    constraint flight_bookings_infant_adult_count check (infants <= adults)
);

-- Keep existing installations compatible when this script is re-run after the original table was created.
alter table public.flight_bookings add column if not exists return_airline text;
alter table public.flight_bookings add column if not exists return_flight_number text;
alter table public.flight_bookings add column if not exists return_departure_time text;
alter table public.flight_bookings add column if not exists return_arrival_time text;

create index if not exists flight_bookings_user_created_idx
    on public.flight_bookings (user_id, created_at desc);

alter table public.flight_bookings enable row level security;

drop policy if exists "Customers can read their own flight bookings" on public.flight_bookings;
create policy "Customers can read their own flight bookings"
    on public.flight_bookings for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Customers can create their own flight booking requests" on public.flight_bookings;
create policy "Customers can create their own flight booking requests"
    on public.flight_bookings for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

revoke all on public.flight_bookings from anon, authenticated;
grant select on public.flight_bookings to authenticated;
grant insert (
    user_id, origin, destination, origin_code, destination_code,
    trip_type, departure_date, return_date, adults, children, infants,
    cabin_class, airline, flight_number, departure_time, arrival_time,
    return_airline, return_flight_number, return_departure_time, return_arrival_time, demo_fare
) on public.flight_bookings to authenticated;

-- No customer UPDATE or DELETE policy/grant is provided.
-- Actual ticket confirmation should be performed only by a trusted server-side workflow.
),
    return_airline text check (return_airline is null or char_length(return_airline) between 2 and 80),
    return_flight_number text check (return_flight_number is null or char_length(return_flight_number) between 2 and 20),
    return_departure_time text check (return_departure_time is null or return_departure_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]
    status text not null default 'pending_confirmation'
        check (status in ('pending_confirmation', 'confirmed', 'cancelled')),
    created_at timestamptz not null default now(),
    constraint flight_bookings_different_cities check (
        lower(origin) <> lower(destination)
    ),
    constraint flight_bookings_return_date check (
        (trip_type = 'One way' and return_date is null)
        or (trip_type = 'Round trip' and return_date is not null and return_date >= departure_date)
    ),
    constraint flight_bookings_infant_adult_count check (infants <= adults)
);

create index if not exists flight_bookings_user_created_idx
    on public.flight_bookings (user_id, created_at desc);

alter table public.flight_bookings enable row level security;

drop policy if exists "Customers can read their own flight bookings" on public.flight_bookings;
create policy "Customers can read their own flight bookings"
    on public.flight_bookings for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Customers can create their own flight booking requests" on public.flight_bookings;
create policy "Customers can create their own flight booking requests"
    on public.flight_bookings for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

revoke all on public.flight_bookings from anon, authenticated;
grant select on public.flight_bookings to authenticated;
grant insert (
    user_id, origin, destination, origin_code, destination_code,
    trip_type, departure_date, return_date, adults, children, infants,
    cabin_class, airline, flight_number, departure_time, arrival_time, demo_fare
) on public.flight_bookings to authenticated;

-- No customer UPDATE or DELETE policy/grant is provided.
-- Actual ticket confirmation should be performed only by a trusted server-side workflow.
),
    return_arrival_time text check (return_arrival_time is null or return_arrival_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]
    status text not null default 'pending_confirmation'
        check (status in ('pending_confirmation', 'confirmed', 'cancelled')),
    created_at timestamptz not null default now(),
    constraint flight_bookings_different_cities check (
        lower(origin) <> lower(destination)
    ),
    constraint flight_bookings_return_date check (
        (trip_type = 'One way' and return_date is null)
        or (trip_type = 'Round trip' and return_date is not null and return_date >= departure_date)
    ),
    constraint flight_bookings_infant_adult_count check (infants <= adults)
);

create index if not exists flight_bookings_user_created_idx
    on public.flight_bookings (user_id, created_at desc);

alter table public.flight_bookings enable row level security;

drop policy if exists "Customers can read their own flight bookings" on public.flight_bookings;
create policy "Customers can read their own flight bookings"
    on public.flight_bookings for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Customers can create their own flight booking requests" on public.flight_bookings;
create policy "Customers can create their own flight booking requests"
    on public.flight_bookings for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

revoke all on public.flight_bookings from anon, authenticated;
grant select on public.flight_bookings to authenticated;
grant insert (
    user_id, origin, destination, origin_code, destination_code,
    trip_type, departure_date, return_date, adults, children, infants,
    cabin_class, airline, flight_number, departure_time, arrival_time, demo_fare
) on public.flight_bookings to authenticated;

-- No customer UPDATE or DELETE policy/grant is provided.
-- Actual ticket confirmation should be performed only by a trusted server-side workflow.
),
    demo_fare numeric(12,2) not null check (demo_fare >= 0),
    status text not null default 'pending_confirmation'
        check (status in ('pending_confirmation', 'confirmed', 'cancelled')),
    created_at timestamptz not null default now(),
    constraint flight_bookings_different_cities check (
        lower(origin) <> lower(destination)
    ),
    constraint flight_bookings_return_date check (
        (trip_type = 'One way' and return_date is null)
        or (trip_type = 'Round trip' and return_date is not null and return_date >= departure_date)
    ),
    constraint flight_bookings_infant_adult_count check (infants <= adults)
);

create index if not exists flight_bookings_user_created_idx
    on public.flight_bookings (user_id, created_at desc);

alter table public.flight_bookings enable row level security;

drop policy if exists "Customers can read their own flight bookings" on public.flight_bookings;
create policy "Customers can read their own flight bookings"
    on public.flight_bookings for select
    to authenticated
    using ((select auth.uid()) = user_id);

drop policy if exists "Customers can create their own flight booking requests" on public.flight_bookings;
create policy "Customers can create their own flight booking requests"
    on public.flight_bookings for insert
    to authenticated
    with check ((select auth.uid()) = user_id);

revoke all on public.flight_bookings from anon, authenticated;
grant select on public.flight_bookings to authenticated;
grant insert (
    user_id, origin, destination, origin_code, destination_code,
    trip_type, departure_date, return_date, adults, children, infants,
    cabin_class, airline, flight_number, departure_time, arrival_time, demo_fare
) on public.flight_bookings to authenticated;

-- No customer UPDATE or DELETE policy/grant is provided.
-- Actual ticket confirmation should be performed only by a trusted server-side workflow.
