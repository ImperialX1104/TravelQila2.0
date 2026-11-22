# Travel Qila — React rebuild

This is the clean React application workspace for the isolated `MERN` branch.

## Stack

- Next.js App Router + React
- Node.js runtime and Next.js route handlers for trusted server-side operations
- Supabase Auth and database through `@supabase/ssr`
- npm

## Run locally

Requires Node.js 20.9 or newer.

```bash
cp .env.example .env.local
npm install
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` in `.env.local`. Never put a service-role key in a `NEXT_PUBLIC_*` variable.

## Migration policy

The QA branch is the functional and visual reference. Rebuild pages as React components and preserve existing URLs, metadata, form contracts, authentication behaviour, database policies, and user journeys. Do not import legacy HTML, vanilla page scripts, Bootstrap/jQuery runtime, or copy old page stylesheets into this app.

The current homepage and shared site shell are the first implementation slice. The application is not production-ready until all QA routes and interactions have been ported and the full staging, visual regression, accessibility, security, and deployment gates pass.
