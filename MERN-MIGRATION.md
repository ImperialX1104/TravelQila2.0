# Travel Qila — clean React application rebuild

## Mission

The `MERN` branch is a clean application rebuild, not a migration wrapper around the legacy website. The QA branch is the behavioural and product reference only. Its existing HTML pages, vanilla JavaScript, CSS framework implementation, and page scripts must not be copied into the new application.

The replacement must provide feature parity with the QA website while implementing the application in React and the supported backend/data stack.

## Approved stack

- **Frontend:** React with Next.js (preferred for routing, metadata, and server rendering) or React + Vite if a verified technical constraint makes it the better fit. Use one framework consistently; do not mix React and Vue.
- **Backend:** Node.js. Use Next.js server handlers/server actions where suitable; add Express only for independently useful API services.
- **Data and identity:** the existing Supabase project, using its supported client/server libraries and the existing Auth, tables, grants, triggers, and RLS policies.
- **Dependencies and scripts:** npm.
- **UI styling:** component-scoped CSS, CSS modules, or a utility framework. Styling is necessary for a browser UI; this does not permit copying the legacy stylesheet/page architecture.
- **Language:** JavaScript/JSX or TypeScript/TSX within the selected React framework. No legacy standalone page scripts.

## What “no HTML/CSS/JS legacy stack” means

- No legacy root-level `.html` pages as application routes.
- No vanilla JavaScript page controllers or direct-DOM application logic.
- No Bootstrap/jQuery/OwlCarousel/lightbox legacy UI runtime.
- No embedding old page markup into React using `dangerouslySetInnerHTML`.
- React components and React state own rendering and interactions.
- The framework's required document shell and browser-rendered HTML are normal; styling files are also required to implement the design.
- Existing image/media assets may be reused after review. Their presence does not mean the old frontend stack is being reused.

## QA parity contract

QA is the source of truth for existing user-visible behaviour. Inventory and reproduce, at minimum:

- Every public route, destination route, content/legal page, metadata requirement, and navigation destination.
- Homepage discovery and calls to action.
- Flight search, itinerary/results interaction, request/booking enquiry, and saved-flight wishlist.
- Hotel search/filter/results, hotel detail/enquiry, and hotel wishlist.
- Visa information and enquiry flow.
- Packages, package details, destinations, and trip enquiry.
- Registration, email confirmation, login, logout, password recovery/reset, protected dashboard, profile, bookings, and saved items.
- Contact and other existing forms, validation, success/error states, and contact handoffs.
- Shared header/footer, responsive layouts, and accessible interactions.

The exact contracts must be derived from the QA source, its test suite, Supabase SQL, and current integration documentation. Do not assume a feature is optional because it is not visible in a landing-page mockup.

## Data and security rules

1. Keep the existing Supabase project and schema behaviour unless a reviewed, separately approved migration is necessary.
2. Use only the public Supabase publishable/anon key in browser code. Never expose service-role keys or private credentials.
3. Preserve and test Auth PKCE/recovery redirects, RLS, grants, ownership checks, and profile triggers.
4. Treat all browser-submitted prices, totals, inventory, and booking metadata as untrusted. Validate on a trusted server before any operation that relies on them.
5. Never claim a demo fare, hotel quote, enquiry, or request is a confirmed booking or payment.
6. Do not put secrets in source control. Provide an environment example containing names/placeholders only.

## Rebuild gates

- [ ] Complete QA route, interaction, API, Supabase, and asset inventory.
- [ ] Record desktop/tablet/mobile reference behaviour and screenshots.
- [ ] Choose and document the single React framework and application structure.
- [ ] Build the shared design system, header, navigation, footer, and routing.
- [ ] Implement all public pages and route/SEO compatibility.
- [ ] Implement flight, hotel, visa, package, enquiry, and contact flows.
- [ ] Implement Supabase Auth, protected dashboard, profile, booking history, and wishlists.
- [ ] Add trusted server-side validation and safe notification handoffs.
- [ ] Add unit, integration, browser E2E, responsive, accessibility, security, and visual regression tests.
- [ ] Verify CI is green and test against a dedicated staging Supabase project with disposable accounts.
- [ ] Verify every QA route and interaction has an equivalent passing test.
- [ ] Only after all gates pass, remove the legacy website files from the MERN branch and prepare a deployment/rollback plan.

## Current status (2026-11-22)

**Not production-ready.** The existing `mern/` Vite/Express files are only an early scaffold and do not implement the Travel Qila application. The legacy website files are still present in this branch. They are retained temporarily as a migration reference/rollback aid and must not be treated as the final architecture.

No feature-parity, visual-regression, live Supabase integration, authenticated isolation, or production deployment certification has been completed. Do not switch production traffic to this branch.
