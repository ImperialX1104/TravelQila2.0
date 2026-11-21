# Travel Qila flight search implementation

## Current mode: mock data
The flight page at `services.html` uses deterministic, locally generated demo itineraries. It does not call an airline, GDS, metasearch, or fare API. All displayed times, flight numbers, fares, durations, stop counts and baggage allowances are illustrative UI test data only. They must never be presented as live inventory or used to confirm a booking.

## Current customer flow
1. Customer enters route, dates, passenger counts and cabin.
2. Browser validates the route and passenger constraints.
3. The page renders illustrative flight cards and supports stop, airline, price and duration sorting/filtering.
4. Customer selects an option and opens a prefilled WhatsApp or email enquiry.
5. The enquiry explicitly asks Travel Qila staff to confirm actual availability and fare.

## Future Travelpayouts adapter
Keep the page and result-card contract independent of the provider. When credentials and permissions are available, implement the provider adapter server-side (for example, a Supabase Edge Function) and normalize provider responses into the same offer shape used by the renderer.

Travelpayouts Data API is affiliate-partner authenticated and serves cached fare insights; it is suitable for route-price inspiration or cached fare content, not guaranteed live availability. The Flight Search API is separately permissioned and subject to strict user-initiated search, complete-result display, book-click link generation, server-side requests, and anti-scraping requirements. Do not call it from browser JavaScript or assume access is granted.

References:
- https://travelpayouts.github.io/slate/
- https://support.travelpayouts.com/hc/en-us/articles/34788165535250-Search-API-usage-rules
- https://support.travelpayouts.com/hc/en-us/articles/20384016664594-Brands-that-provide-access-to-APIs-and-data-feeds-for-Travelpayouts-partners

## Credentials and safety
- No API key or secret is required for mock mode.
- Never place Travelpayouts tokens or other provider secrets in HTML, CSS, frontend JavaScript, or public GitHub repository files.
- Add provider credentials only as server-side secrets after access is approved.
- Never represent demo fares as bookable or charge a customer based on mock data.
