# Travel Qila — clean React application rebuild

## Mission

The `MERN` branch is a clean application rebuild, not a React wrapper around the legacy website. The QA branch is the behavioural and visual reference only. Its HTML pages, vanilla JavaScript page controllers, and legacy stylesheet/framework implementation must not be copied into the new application.

## Target architecture

- **Frontend:** Next.js App Router + React.
- **Runtime/backend:** Node.js via Next.js server components, route handlers, and server actions where appropriate. Add a separate Express service only if a real requirement justifies it.
- **Database and authentication:** the existing Supabase project using `@supabase/ssr` and `@supabase/supabase-js`.
- **Dependencies:** npm.
- **Styling:** newly authored React-app styles (CSS modules or global design tokens). CSS is necessary to render a faithful responsive browser UI; legacy CSS/framework files are not to be imported.
- **Language:** JavaScript/JSX for the application unless a later, consistent TypeScript conversion is approved.

## What “no legacy HTML/CSS/JS stack” means

- No legacy root-level `.html` files as application pages.
- No vanilla JavaScript page controllers or direct DOM mutation for application features.
- No Bootstrap, jQuery, OwlCarousel, or Lightbox runtime.
- No copied legacy stylesheet or `dangerouslySetInnerHTML` migration.
- React components, state, forms, routing, and server operations own the product.
- The Next.js document shell and browser-rendered HTML are normal framework behaviour; authored CSS is required for visual parity.
- Reviewed image/media assets may be reused. Asset reuse does not mean reusing the legacy frontend implementation.

## QA parity contract

Every existing QA route, visible feature, form, navigation destination, state transition, and backend interaction must have an equivalent tested implementation. Current known feature groups include:

- Homepage, shared navigation/footer, responsive layouts, metadata and SEO.
- About, blog, contact, gallery, guides, testimonials, tour content, and legal pages.
- All destination pages, package listings, package details, and trip enquiry.
- Flight search, sample itinerary/results, filters, selection/review, enquiry/save flow, and saved-flight wishlist.
- Hotel search, filters, results, quote breakdown, booking enquiry, WhatsApp handoff, and hotel wishlist.
- Visa information and email/WhatsApp enquiry handoff.
- Registration, email confirmation, login, logout, Google/Apple OAuth where enabled, password recovery/reset, protected dashboard, profile, bookings, and saved items.
- Correct route/URL compatibility for existing `.html` URLs unless an explicit redirect plan is tested.

The exact contracts must be derived from the QA source, its browser tests, Supabase SQL, and integration documentation. Do not silently drop a feature because it is absent from the first homepage slice.

## Data and security rules

1. Retain the existing Supabase project, schema, Auth behaviour, grants, triggers, and RLS unless a reviewed migration is separately approved.
2. Browser code may use only the public publishable/anon key. Never expose service-role credentials.
3. Preserve PKCE, email confirmation/recovery redirects, session refresh, RLS ownership, and profile-trigger behaviour.
4. Treat browser-submitted prices, totals, inventory, and booking metadata as untrusted. Validate trusted operations server-side.
5. Never claim a demo fare, hotel quote, enquiry, or request is a confirmed booking or payment.
6. Never commit real secrets. Use placeholder-only environment examples.

## Delivery gates

- [ ] Complete QA route, interaction, API, Supabase, and asset inventory.
- [ ] Capture reference screenshots at desktop, tablet, and mobile widths.
- [ ] Implement shared React design system, navigation, footer, and responsive shell.
- [ ] Port every public route and preserve SEO/canonical metadata.
- [ ] Port flight, hotel, visa, package, contact, and all other enquiry flows.
- [ ] Port Supabase Auth, protected dashboard, profile, booking history, and wishlists.
- [ ] Add trusted server-side validation and safe notification handoffs.
- [ ] Add unit, integration, browser E2E, visual regression, accessibility, and security tests.
- [ ] Run CI successfully and test against a dedicated staging Supabase project with disposable identities.
- [ ] Verify route-by-route and interaction-by-interaction parity against QA.
- [ ] Remove legacy website pages and scripts from MERN only after all replacement routes pass.
- [ ] Configure production hosting, environment variables, redirects, monitoring, and rollback plan.
- [ ] Cut over only after user approval and all production gates pass.

## Current status (2026-11-22)

The MERN workspace has now been switched from the initial Vite/React Router scaffold to a clean Next.js App Router + React workspace. It includes a first homepage/shared-shell implementation, Supabase browser/server client factories, basic validation helpers/tests, and a Next.js CI workflow.

**This is an initial implementation slice, not a completed website and not production-ready.** Most QA routes, the complete flight/hotel/visa flows, authentication UI/session middleware, dashboard, and comprehensive automated parity tests remain to be implemented and verified. The 34 legacy QA HTML pages are still present in the MERN branch as a temporary reference; they are not part of the new Next.js application. Do not point production traffic at this branch.
