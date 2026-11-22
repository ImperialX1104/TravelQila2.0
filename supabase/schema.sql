-- Travel Qila account profiles.
-- Apply in Supabase Dashboard > SQL Editor.
-- This migration intentionally does not create bookings, payments, or admin roles.

create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    full_name text not null default '',
    phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint profiles_full_name_length check (char_length(full_name) <= 100),
    constraint profiles_phone_length check (phone is null or char_length(phone) <= 30)
);

alter table public.profiles enable row level security;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
    on public.profiles for select
    to authenticated
    using ((select auth.uid()) = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
    on public.profiles for update
    to authenticated
    using ((select auth.uid()) = id)
    with check ((select auth.uid()) = id);

-- Profile rows are inserted only by the auth-user trigger.
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
    before update on public.profiles
    for each row execute function public.set_profile_updated_at();

create or replace function public.handle_new_travelqila_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
    insert into public.profiles (id, full_name, phone)
    values (
        new.id,
        left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 100),
        nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'phone', '')), 30), '')
    )
    on conflict (id) do nothing;

    return new;
end;
$$;

-- The trigger can invoke this function; browser roles must not invoke it directly.
revoke all on function public.handle_new_travelqila_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_travelqila on auth.users;
create trigger on_auth_user_created_travelqila
    after insert on auth.users
    for each row execute function public.handle_new_travelqila_user();

-- Backfill profiles for users created before the trigger existed.
insert into public.profiles (id, full_name, phone)
select
    u.id,
    left(btrim(coalesce(u.raw_user_meta_data ->> 'full_name', '')), 100),
    nullif(left(btrim(coalesce(u.raw_user_meta_data ->> 'phone', '')), 30), '')
from auth.users as u
on conflict (id) do nothing;
