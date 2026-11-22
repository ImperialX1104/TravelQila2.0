-- Hotel wishlist and booking enquiry storage for Travel Qila.
-- Apply this migration in Supabase SQL Editor before enabling hotel actions.

create table if not exists public.hotel_wishlists (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    hotel_id text not null,
    hotel_name text not null,
    destination text not null,
    star_rating smallint not null check (star_rating between 1 and 5),
    nightly_rate numeric(12,2) not null check (nightly_rate >= 0),
    taxes numeric(12,2) not null default 0 check (taxes >= 0),
    total_price numeric(12,2) not null check (total_price >= 0),
    currency text not null default 'INR' check (currency = 'INR'),
    image_url text,
    check_in date,
    check_out date,
    guests smallint not null default 2 check (guests between 1 and 12),
    created_at timestamptz not null default now(),
    constraint hotel_wishlists_user_hotel_unique unique (user_id, hotel_id),
    constraint hotel_wishlists_dates_valid check (
        check_in is null or check_out is null or check_out > check_in
    )
);

alter table public.hotel_wishlists enable row level security;
drop policy if exists "Users can view their own hotel wishlist" on public.hotel_wishlists;
create policy "Users can view their own hotel wishlist"
    on public.hotel_wishlists for select to authenticated
    using ((select auth.uid()) = user_id);
drop policy if exists "Users can save hotels to their own wishlist" on public.hotel_wishlists;
create policy "Users can save hotels to their own wishlist"
    on public.hotel_wishlists for insert to authenticated
    with check ((select auth.uid()) = user_id);
drop policy if exists "Users can remove hotels from their own wishlist" on public.hotel_wishlists;
create policy "Users can remove hotels from their own wishlist"
    on public.hotel_wishlists for delete to authenticated
    using ((select auth.uid()) = user_id);
revoke all on public.hotel_wishlists from anon, authenticated;
grant select, insert, delete on public.hotel_wishlists to authenticated;

create index if not exists hotel_wishlists_user_created_idx
    on public.hotel_wishlists (user_id, created_at desc);

create table if not exists public.hotel_booking_requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    hotel_id text not null,
    hotel_name text not null,
    destination text not null,
    check_in date not null,
    check_out date not null,
    guests smallint not null check (guests between 1 and 12),
    rooms smallint not null default 1 check (rooms between 1 and 6),
    nightly_rate numeric(12,2) not null check (nightly_rate >= 0),
    taxes numeric(12,2) not null check (taxes >= 0),
    total_price numeric(12,2) not null check (total_price >= 0),
    currency text not null default 'INR' check (currency = 'INR'),
    status text not null default 'enquiry_received'
        check (status in ('enquiry_received','contacted','confirmed','cancelled')),
    customer_name text not null,
    customer_email text not null,
    customer_phone text,
    created_at timestamptz not null default now(),
    constraint hotel_booking_dates_valid check (check_out > check_in)
);

alter table public.hotel_booking_requests enable row level security;
drop policy if exists "Users can view their own hotel booking requests" on public.hotel_booking_requests;
create policy "Users can view their own hotel booking requests"
    on public.hotel_booking_requests for select to authenticated
    using ((select auth.uid()) = user_id);
drop policy if exists "Users can create their own hotel booking requests" on public.hotel_booking_requests;
create policy "Users can create their own hotel booking requests"
    on public.hotel_booking_requests for insert to authenticated
    with check ((select auth.uid()) = user_id);
revoke all on public.hotel_booking_requests from anon, authenticated;
grant select, insert on public.hotel_booking_requests to authenticated;

create index if not exists hotel_booking_requests_user_created_idx
    on public.hotel_booking_requests (user_id, created_at desc);
