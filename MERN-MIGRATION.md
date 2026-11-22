# Travel Qila — MERN migration

## Source and isolation

- Source branch: `qa/bug-free-homepage-redesign`
- Target branch: `MERN`
- The existing multi-page QA application remains in place while React routes are migrated.
- The migration workspace lives under `mern/`; it does not replace the root website or change GitHub Pages deployment.

## Target architecture

- React + React Router for the browser application.
- Node.js + Express for server-side operations that genuinely require a trusted server.
- Existing Supabase project remains the database and authentication provider.
- Existing Supabase tables, RLS policies, grants, triggers, and auth settings are not modified by this migration scaffold.

## Non-negotiable parity requirements

1. Preserve every existing public route, page section, image, typography, spacing, responsive breakpoint, metadata, and navigation destination.
2. Preserve existing customer flows: flight search and itinerary review, hotel search and enquiry, visa information/enquiry, packages, contact, auth, dashboard, wishlist, and legal pages.
3. Preserve Supabase Auth behaviour and redirect allowlist. Use only the existing public publishable/anon key in browser code.
4. Never expose a Supabase service-role key or other private credential to the browser.
5. Do not weaken RLS, grants, auth checks, input validation, output escaping, or ownership checks.
6. Server-side validation must be added before trusting prices, totals, or customer-supplied booking metadata. Do not silently change the current customer-facing quote or booking flow.
7. Keep demo inventory and quote limitations explicit; do not imply a confirmed airline ticket, hotel reservation, or payment where none exists.

## Migration sequence

- [x] Create this isolated branch from the QA branch.
- [x] Add a separate React/Vite workspace and an Express API health endpoint.
- [ ] Inventory every HTML route, script, stylesheet, asset, and form contract.
- [ ] Capture baseline screenshots at desktop, tablet, and mobile sizes.
- [ ] Port shared header, navigation, footer, typography, and global layout with screenshot parity.
- [ ] Port public pages in route groups without changing their URLs or SEO metadata.
- [ ] Port flight, hotel, visa, package, contact, auth, and dashboard interactions.
- [ ] Integrate Supabase Auth and data access with the existing project and policies.
- [ ] Add server-side validation for any trusted booking or pricing operation.
- [ ] Run visual regression, route/link, accessibility, responsive, auth, RLS, and end-to-end tests.
- [ ] Switch deployment only after parity and security gates pass.

## Local development

From this directory:

```bash
cd mern
cp .env.example .env
npm install
npm run dev
```

The isolated React workspace is served at `http://127.0.0.1:5173`; the Express health endpoint is at `http://127.0.0.1:3001/api/health`.

This is a migration scaffold, not a completed replacement website. Do not point production traffic at it until the checklist above is complete.
