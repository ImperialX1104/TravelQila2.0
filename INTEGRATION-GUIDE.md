# Travel Qila Authentication — Integration Guide

This is an **overlay package** for the existing `ImperialX1104/TravelQila2.0` static HTML/CSS/JS site. Copy the files into the matching folders; do not replace your existing `css/style.css`, Bootstrap files, images, or `js/main.js`.

## What the repository analysis found

- Static multi-page HTML site; no application server or existing authentication backend is present.
- Bootstrap stylesheet at `css/bootstrap.min.css`.
- Shared site styling at `css/style.css`; existing `js/main.js` is a jQuery page-interaction file.
- The shared top bar contains placeholder `Register`, `Login`, `My Dashboard`, and `Log Out` links.
- The source uses the navy brand colour `#13357B` (also visible in inline backgrounds such as `rgba(19, 53, 123, ...)`).
- The README describes backend-connected functionality as future work; the current booking/contact forms are not an authentication backend.

## Included files

```text
css/auth.css
js/auth-config.js
js/auth-client.js
js/auth-pages.js
js/auth-nav.js
login.html
register.html
forgot-password.html
reset-password.html
dashboard.html
supabase/schema.sql
```

## 1. Create and configure Supabase

1. Create a Supabase project.
2. Open **Project Settings → API** and copy the Project URL and **publishable key** (or legacy anon key).
3. Edit `js/auth-config.js`:
   - `supabaseUrl`: your project URL.
   - `supabasePublishableKey`: your publishable/anon key.
   - `siteUrl`: your canonical site origin, e.g. `https://www.travelqila.com` (no trailing slash). For local testing, use your local server origin.
4. Never use a Supabase `secret` or `service_role` key in browser code, Git, HTML, or this ZIP.

## 2. Create the profile table and security policies

Run `supabase/schema.sql` in **Supabase → SQL Editor**. This creates:
- `public.profiles` with name and phone fields.
- A trigger that creates a profile row when an auth user is created.
- Row Level Security policies so an authenticated user can read/update only their own row.
- No public or anonymous profile access.

The dashboard profile editor depends on this SQL. Do not remove RLS or grant public access to the profile table.

## 3. Configure email authentication

In Supabase **Authentication → URL Configuration**:
- Set **Site URL** to the production origin.
- Add the exact redirect URLs for your deployed site:
  - `https://YOUR_DOMAIN/login.html`
  - `https://YOUR_DOMAIN/login.html?verified=1`
  - `https://YOUR_DOMAIN/reset-password.html`
- Add your local development URLs too, for example:
  - `http://127.0.0.1:5500/login.html`
  - `http://127.0.0.1:5500/reset-password.html`

In **Authentication → Providers → Email**:
- Enable email/password sign-in.
- Keep email confirmation enabled.
- Set the minimum password length to at least 12 and use a strong password policy.
- Configure a custom SMTP provider before production. Supabase's built-in email sender is intended for testing and is rate-limited; do not depend on it for a live customer site.
- Review email confirmation and password recovery templates and brand them as Travel Qila.

## 4. Add the auth navigation script to existing pages

On each existing public page that contains the shared top bar (`index.html`, `about.html`, `services.html`, `hotels.html`, `visa.html`, `packages.html`, `blog.html`, `destination.html`, `tour.html`, `gallery.html`, `guides.html`, `testimonial.html`, `contact.html`, `terms.html`, `404.html`), add these two lines immediately before `</body>`:

```html
<script src="js/auth-config.js"></script>
<script type="module" src="js/auth-nav.js"></script>
```

Do not remove the existing Bootstrap, jQuery, Owl Carousel, or `js/main.js` scripts. The module script can be placed after them. The script finds the existing topbar links by their visible labels and changes the placeholder `#` links to the new auth pages. It hides login/register when signed in and exposes the dashboard/logout links. The unused template `Inbox` and `Notifications` items are hidden because those features are not part of this authentication package.

## 5. Copy the files

Copy the package folders into your project root, preserving paths:
- `css/auth.css` → project `css/auth.css`
- `js/*.js` → project `js/`
- the five HTML pages → project root
- `supabase/schema.sql` → keep as a deployment/setup artifact; it is not served as a page

Do not overwrite `css/style.css` or `js/main.js`.

## 6. Test locally

Serve the site over HTTP (VS Code Live Server or `npx serve .`). Do not test the auth flow by opening HTML pages with `file://`.

Test all of these:
1. Register with a new email address.
2. Confirm the email using the link received.
3. Sign in and reload the page; the session should persist.
4. Open `dashboard.html` while signed out; it should redirect to login.
5. Update the name and phone; reload and confirm the saved values persist.
6. Request a password reset; open the email link and set a new password.
7. Sign out from the dashboard and from the site's top bar.
8. Confirm one account cannot read or update another account's profile (RLS).

## 7. Production release checklist

- Use HTTPS and the canonical domain in Supabase URL Configuration.
- Configure production SMTP and test email delivery, spam-folder behavior, sender domain and SPF/DKIM/DMARC.
- Enable Supabase leaked-password protection if available on your plan.
- Review Auth rate limits and enable CAPTCHA/Turnstile protection for sign-up/recovery if abuse risk warrants it.
- Keep the publishable key public, but keep every secret/service-role key server-side only.
- Review Supabase Auth logs and database logs after launch.
- Test on current desktop and mobile browsers.
- Add privacy-policy and terms links that point to your approved legal documents.

## Important architecture/security boundary

This repository is static HTML/CSS/JS. Supabase Auth provides real identity verification and RLS-protected profile data, but client-side route redirects are **not** a security boundary: a static HTML file can still be downloaded by a visitor. Never put private data, admin controls, booking/payment secrets, or privileged business logic in a static page. For those, add a trusted backend/API or Supabase Edge Function and enforce authorization server-side/RLS.

The dashboard in this package is intentionally limited to account/profile details. It does not claim to provide booking history, payments, inbox, notifications, or admin functions because the existing repository does not currently expose those backend services.

## CDN dependency

The client imports the pinned Supabase JS v2 module from `esm.sh`. If you prefer self-hosted dependencies, install `@supabase/supabase-js` in your own build process and replace the import in `js/auth-client.js` with your bundled module path.
