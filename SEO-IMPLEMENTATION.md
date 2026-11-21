# Travel Qila SEO implementation notes

## Scope

This branch prepares the SEO foundation for a holiday package and travel planning service targeting India-wide and international customers in English. The main branch remains untouched.

## Implemented on this branch

- Unique title, meta description, canonical, robots, Open Graph and Twitter metadata for public core pages.
- TravelAgency JSON-LD on the homepage using the business contact details already displayed by the website.
- Noindex directives on login, registration, password reset and dashboard pages.
- XML sitemap including existing public pages and 11 destination landing pages.
- robots.txt allows crawlers to read noindex directives and points to the sitemap.
- Destination hub links to 11 destination landing pages.
- Destination landing pages cover Thailand, Dubai, Vietnam, Bali, Singapore, Kashmir, Goa, Kerala, Maldives, Malaysia and Europe.
- Homepage H1 is aligned to holiday package and travel planning intent; primary heading hierarchy has been corrected on the existing section pages.
- Destination landing pages link to trip enquiry/contact paths and include visible itinerary-planning guidance and FAQs.

## Deployment checks required

1. Confirm production host preference (www or non-www), HTTP-to-HTTPS redirects and slash conventions. All canonical and sitemap URLs currently assume https://travelqila.com.
2. Confirm the actual hosting document root serves the repository branch/files as expected. The branch is not live until deployed.
3. Test every new URL for HTTP 200, correct MIME type and mobile rendering. Verify 404 pages return actual HTTP 404 status.
4. Verify sitemap is available at https://travelqila.com/sitemap.xml and robots at https://travelqila.com/robots.txt after deployment.
5. Validate JSON-LD with Schema.org Validator and Rich Results Test. Structured data does not guarantee a rich result.
6. Run Google Search Console URL Inspection and submit sitemap after release.
7. Run Lighthouse/PageSpeed Insights on mobile and desktop; address LCP, INP, CLS, image sizing, compression, caching and unused scripts.
8. Check internal links, image alt text, empty anchors, duplicate IDs, mixed content, redirects and canonical consistency.
9. Confirm each destination page is genuinely supported by the services and itineraries the business can deliver. Add verified inclusions, pricing, trip durations, seasonal advice and original photography before promotion.
10. Add Google Analytics 4 or another consent-aware analytics setup and measure enquiry form, click-to-call, email and WhatsApp conversions.

## Important content and compliance notes

- Destination pages are editorial/lead-generation landing pages, not proof of live package availability.
- Package prices, inclusions, availability and destination information must be checked before publication.
- Verify the TravelAgency address, telephone and email against the business's current official details before production.
- Do not add fake ratings, testimonials, review schema, offer schema or guaranteed claims.
- The legal pages may remain indexable if they contain complete, current legal text; keep account pages noindex.
- Avoid blocking noindex URLs in robots.txt, because crawlers need access to read the directive.
- No keyword-density target is required. Prioritize helpful, specific copy and clear internal links.
