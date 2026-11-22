# Travel Qila — React rebuild

This workspace is the new React application for the isolated `MERN` branch.

## Stack

- Next.js App Router + React
- Node.js runtime and Next.js route handlers for server-side operations
- Supabase Auth and database through `@supabase/ssr`
- npm

## Run locally

Requires Node.js 20.9 or newer.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set the public Supabase URL and publishable key in `.env.local`. Never put a service-role key in a `NEXT_PUBLIC_*` variable.

## Migration policy

The QA branch is the functional and visual reference. Rebuild pages as React components and preserve existing URLs, metadata, form contracts, authentication behaviour, database policies, and user journeys. Do not import legacy HTML, vanilla page scripts, Bootstrap/jQuery runtime, or copy old page stylesheets into this app.

This application is not production-ready until the full QA parity checklist, staging Supabase tests, visual regression suite, accessibility checks, and deployment checks pass.
