# Supabase Auth & Profile Verification

Run this checklist against a dedicated staging Supabase project before production. Do not use a real customer's account or share passwords, access tokens, refresh tokens, or service-role keys.

## Environment prerequisites

- Confirm `js/auth-config.js` points to the intended Supabase project.
- In Supabase Auth URL Configuration, set the production Site URL and explicitly allow the exact login and reset redirect URLs used by the site.
- Enable Email provider and configure SMTP before production.
- Apply `supabase/schema.sql`.
- Serve the site over HTTPS (or localhost for development); do not use `file://`.
- Create two disposable test identities, User A and User B, using inboxes you control.

## Login and account test cases

| ID | Scenario | Action | Expected result |
|---|---|---|---|
| AUTH-01 | New registration | Register User A with valid name, email, phone and strong password | Account is created; verification email arrives; profile row is created |
| AUTH-02 | Email confirmation | Open User A's confirmation link | Redirects to the configured login URL; account is confirmed |
| AUTH-03 | Valid login | Sign in as User A with correct credentials | Redirects to dashboard |
| AUTH-04 | Invalid password | Sign in as User A with an incorrect password | Generic error; no dashboard access |
| AUTH-05 | Unknown email | Sign in with an unregistered address | Generic error; no account enumeration in UI |
| AUTH-06 | Session persistence | Reload dashboard after successful login | Session remains valid and profile loads |
| AUTH-07 | Protected dashboard | Open dashboard in a clean signed-out browser | Redirects to login |
| AUTH-08 | Profile update | Change User A's name and phone, save, reload | New values persist; success only if a row was updated |
| AUTH-09 | Profile isolation | Sign in as User A and attempt to read/update User B's profile using the browser client | User A cannot read or alter User B's row |
| AUTH-10 | Password recovery | Request reset for User A and open email link | Reset page opens with a valid recovery session |
| AUTH-11 | Password change | Submit a valid new password and sign in again | New password works; old password no longer works |
| AUTH-12 | Expired/invalid recovery link | Open an expired or modified reset URL | Reset form remains disabled and asks for a fresh link |
| AUTH-13 | Sign out | Sign out from dashboard, then revisit dashboard | Session is cleared; dashboard redirects to login |
| AUTH-14 | Duplicate registration | Register User A's email again | No duplicate identity/profile is created; UI gives a safe generic response |
| AUTH-15 | Direct URL access | While signed out, open profile/dashboard URLs directly | No private profile data is rendered or returned |

## Read-only database diagnostics

Run in Supabase SQL Editor. These queries return counts and policy metadata, not customer profile contents.

```sql
-- 1. Counts and orphan checks
select
  (select count(*) from auth.users) as auth_user_count,
  (select count(*) from public.profiles) as profile_count,
  (select count(*) from auth.users u
     left join public.profiles p on p.id = u.id
     where p.id is null) as users_missing_profiles,
  (select count(*) from public.profiles p
     left join auth.users u on u.id = p.id
     where u.id is null) as orphan_profiles;

-- 2. Confirm RLS is enabled
select n.nspname as schema_name, c.relname as table_name, c.relrowsecurity as rls_enabled,
       c.relforcerowsecurity as rls_forced
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'profiles';

-- 3. Inspect policies
select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;

-- 4. Inspect table grants
select grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'profiles'
order by grantee, privilege_type;

-- 5. Confirm profile trigger exists and is enabled
select t.tgname, t.tgenabled, pg_get_triggerdef(t.oid) as trigger_definition
from pg_trigger t
join pg_class c on c.oid = t.tgrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'auth' and c.relname = 'users' and not t.tgisinternal
  and t.tgname = 'on_auth_user_created_travelqila';
```

## Security expectations

- RLS is enabled on `public.profiles`.
- Authenticated SELECT and UPDATE policies both constrain `id` to `auth.uid()`.
- No anon SELECT/INSERT/UPDATE/DELETE access exists.
- Authenticated users have SELECT and column-limited UPDATE only; no direct INSERT or DELETE.
- The auth.users trigger creates exactly one profile row per user.
- User A cannot access User B's profile, even if the client changes the requested UUID.
- No service-role/secret key is present in HTML, JavaScript, repository history, or browser network requests.

## What has and has not been executed

The repository source has been reviewed and two client-side defects were corrected on the feature branch. The live login, email delivery, redirect allow-list, Auth provider settings, database grants/policies and trigger cannot be certified from source code alone. Run the cases above against the connected Supabase project and share the redacted SQL results plus the failing case ID/error text (never credentials or tokens) for the next debugging pass.
