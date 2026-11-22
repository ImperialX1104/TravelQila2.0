# Travel Qila

<p align="center">
  <strong>A responsive travel discovery and enquiry platform for flights, hotels, holiday packages and visa assistance.</strong>
</p>

<p align="center">
  <a href="https://imperialx1104.github.io/TravelQila2.0/"><img src="https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-17458F?style=for-the-badge&logo=github" alt="Live demo"></a>
  <img src="https://img.shields.io/badge/Frontend-HTML%20%7C%20CSS%20%7C%20JavaScript-blue?style=for-the-badge" alt="Frontend stack">
  <img src="https://img.shields.io/badge/Backend-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase">
</p>

<p align="center">
  <a href="https://imperialx1104.github.io/TravelQila2.0/index.html">Visit the website</a> ·
  <a href="https://github.com/ImperialX1104/TravelQila2.0/tree/qa/bug-free-homepage-redesign">QA development branch</a> ·
  <a href="https://github.com/ImperialX1104/TravelQila2.0/actions">Build and QA workflows</a>
</p>

---

## Overview

**Travel Qila** is a multi-page travel website that helps visitors explore travel services and submit enquiries for their trips. The experience brings together destination discovery, holiday packages, flight search, hotel discovery, visa information and customer account features.

The current implementation is a static HTML, CSS and JavaScript frontend. Supabase provides customer authentication and database-backed, user-scoped features. Some travel inventory and prices are illustrative demo data: they are not live supplier availability, confirmed reservations or final payable quotes.

## Website features

- **Homepage and destination discovery** — travel-focused landing page, destination content and featured experiences.
- **Flight search experience** — one-way and round-trip search flow, outbound and return selection, filters, itinerary review, fare estimate, wishlist and booking-request flow.
- **Hotel discovery** — destination and date search, guest and star filters, budget filtering, hotel estimates, wishlist and booking enquiry.
- **Visa assistance** — visa information and enquiry journey.
- **Holiday packages and tours** — package discovery, tour details and trip enquiry pages.
- **Customer accounts** — registration, email verification, login, password recovery and logout through Supabase Auth.
- **Customer dashboard** — protected account/profile experience and supported saved travel items.
- **Travel content** — destinations, guides, blog, gallery and testimonials.
- **Contact and legal information** — contact, privacy and terms pages.

## Important booking and inventory limitations

Travel Qila currently provides **search and enquiry experiences**, not a complete live travel-booking or ticketing system.

- Flight options and fares are generated demo data. The displayed tax/fee estimate is illustrative. No airline seat is reserved, no payment is collected and no PNR or e-ticket is issued.
- Hotel listings and rates are illustrative catalogue estimates, not live property inventory or confirmed offers. Availability, taxes and final rates must be checked by the Travel Qila team.
- A submitted booking request or enquiry is a request for follow-up, not a confirmed booking.
- Visa information is general guidance. Eligibility, document requirements, fees and decisions must be confirmed with the relevant embassy, consulate or authorised authority.
- Do not represent demo prices, availability or estimates as guaranteed supplier offers.

A production booking experience requires approved supplier integrations and trusted server-side workflows for live availability, fare/rate validation, booking confirmation, payment and ticket/voucher issuance.

## Technology

| Technology | Role |
|---|---|
| HTML5 | Multi-page site structure and content |
| CSS3 | Responsive styling and page layouts |
| JavaScript (ES modules) | Search, forms, account flows and UI interactions |
| SCSS | Stylesheet source |
| Bootstrap | Layout and responsive components |
| jQuery and existing UI libraries | Template interactions and selected components |
| Supabase Auth | Customer registration, login and session management |
| Supabase Postgres | RLS-protected profiles, booking requests and saved travel items |
| Playwright | Automated browser and site QA |

The repository is a static frontend; it does not contain a conventional Node/Express application server. The root `package.json` is used for the Playwright QA tooling.

## Repository structure

The following is a high-level guide to the repository. Some folders contain additional assets and supporting files.

```text
TravelQila2.0/
├── .github/
│   └── workflows/          # GitHub Actions workflows
├── css/                    # Stylesheets, including page-specific styles
├── img/                    # Images and visual assets
├── js/                     # Frontend scripts and ES modules
├── lib/                    # Supporting frontend libraries
├── scss/                   # SCSS source files
├── scripts/                # Supporting scripts
├── supabase/               # SQL schema, booking migrations and setup/test guides
├── tests/
│   └── site-qa.mjs          # Playwright browser and site checks
├── destinations/           # Destination landing pages
├── index.html              # Homepage
├── flights.html             # Flight search experience (if present in this branch)
├── hotels.html              # Hotel discovery and enquiry
├── visa.html                # Visa assistance
├── packages.html            # Holiday packages
├── services.html            # Travel services
├── login.html               # Customer login
├── register.html            # Customer registration
├── forgot-password.html    # Password recovery request
├── reset-password.html     # Password reset
├── dashboard.html           # Customer dashboard
├── contact.html             # Contact page
├── privacy.html             # Privacy policy
├── terms.html               # Terms and conditions
├── package.json             # QA tooling dependencies and scripts
└── README.md                # Project documentation
```

> The exact page inventory can vary by branch as development continues. Check the repository tree for the authoritative list of files in the branch you are using.

## Run locally

You need Git, Node.js and npm. The website should be served over HTTP rather than opened using a `file://` URL, particularly because the authentication code uses JavaScript modules and Supabase.

1. Clone the repository:

   ```bash
   git clone https://github.com/ImperialX1104/TravelQila2.0.git
   cd TravelQila2.0
   ```

2. Check out the branch you intend to work on:

   ```bash
   git switch qa/bug-free-homepage-redesign
   ```

3. Start a local static server. For example, with the VS Code Live Server extension, open the project and choose **Open with Live Server**. Alternatively, if you have a compatible static server installed:

   ```bash
   npx serve .
   ```

4. Open the local URL printed by the server and navigate to `index.html`.

## Supabase setup

The frontend uses a Supabase project configured in `js/auth-config.js`.

1. Create or select the intended Supabase project.
2. Configure the project URL and **publishable key** in `js/auth-config.js`. A publishable/legacy anon key is designed for browser use when database permissions and Row Level Security (RLS) are correctly configured.
3. Never put a Supabase secret or `service_role` key in browser JavaScript, HTML, Git history or public build output.
4. Apply the relevant SQL files from `supabase/` in the Supabase SQL Editor. Review each setup guide and migration before applying it; do not assume every SQL file is interchangeable or safe to run in an arbitrary order.
5. Configure Supabase Authentication URL settings with the exact production and local redirect URLs used by the application.
6. Configure and test email delivery (custom SMTP is recommended before production).
7. Use disposable staging accounts to verify registration, email confirmation, login, password recovery, logout and account isolation.

Useful setup documentation:

- [Authentication integration guide](INTEGRATION-GUIDE.md)
- [Supabase authentication test plan](supabase/AUTH-TEST-PLAN.md)
- [Flight booking setup](supabase/FLIGHT-BOOKINGS-SETUP.md)

**Security boundary:** client-side redirects and hidden UI elements are not authorization controls. Enforce access in Supabase RLS policies and trusted server-side code. Never expose private customer data or privileged business logic through public static pages.

## Automated QA

The repository includes a Playwright-based site QA script.

Install the QA dependency:

```bash
npm install
npx playwright install chromium
```

Run the checks:

```bash
npm run qa
```

The browser QA script checks the site's HTML pages and selected page-specific expectations, including navigation and booking/search interfaces. GitHub Actions runs the configured checks on the relevant branch events.

A passing automated run is useful evidence, but it is not a guarantee that every user journey, browser, backend policy or security property is correct. Review the latest [GitHub Actions runs](https://github.com/ImperialX1104/TravelQila2.0/actions) and investigate failures against the current page implementation. Keep selectors and assertions aligned with the actual UI as it evolves.

### Recommended pre-release checks

- [ ] Run `npm run qa` and resolve all current failures.
- [ ] Check internal links, navigation, header and footer consistency across pages.
- [ ] Test responsive layouts on mobile, tablet and desktop.
- [ ] Test forms, validation, empty states and error states.
- [ ] Test flight and hotel enquiry flows without representing demo inventory as live.
- [ ] Test authentication and password recovery in a staging Supabase project.
- [ ] Verify RLS isolation with two separate disposable accounts.
- [ ] Confirm no secret/service-role credentials are present in frontend assets or repository history.
- [ ] Review browser console errors, failed network requests and third-party dependencies.
- [ ] Verify production HTTPS, canonical URLs, email delivery and legal-page links.

## Security reporting

If you discover a security issue, do not publish customer information, credentials, tokens or exploitable details in a public issue. Report it privately to the repository owner with the affected page or component, impact, reproduction conditions and a redacted proof of concept.

Security testing should be limited to systems and accounts for which you have explicit authorization. Use staging data and avoid destructive tests or high-volume traffic.

## Deployment

The project is published through GitHub Pages:

- **Website:** https://imperialx1104.github.io/TravelQila2.0/
- **Repository:** https://github.com/ImperialX1104/TravelQila2.0

Deployment is controlled by the repository's GitHub Pages configuration and workflow. Confirm the configured publishing branch and source directory in **Settings → Pages** before changing deployment settings. A successful Pages deployment confirms publication, not that browser QA or backend security checks passed.

## Contributing

1. Create a feature branch from the intended development baseline.
2. Keep changes focused and preserve existing page conventions.
3. Test affected pages locally.
4. Run `npm run qa` and review the workflow result.
5. Open a pull request with a concise description, screenshots where relevant and test evidence.

For the current redesign and QA work, see the [`qa/bug-free-homepage-redesign` branch](https://github.com/ImperialX1104/TravelQila2.0/tree/qa/bug-free-homepage-redesign).

## License

Refer to the repository's [LICENSE](LICENSE) file and any additional license notices for the applicable terms.

## Maintainer

**Imperial Technologies**  
GitHub: [@ImperialX1104](https://github.com/ImperialX1104)

---

<p align="center">
  <strong>Travel Qila — Explore the world together. 🌍</strong>
</p>
