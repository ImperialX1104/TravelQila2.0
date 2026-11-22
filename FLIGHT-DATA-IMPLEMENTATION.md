# Travel Qila flight search implementation

## Current mode: guided mock booking flow

The flight page at `services.html` uses deterministic, locally generated demo itineraries. It does not call an airline, GDS, metasearch, or fare API. All displayed times, flight numbers, fares, durations, stop counts and baggage allowances are illustrative UI test data only.

## Customer journey

1. Customer chooses a route, one-way or round-trip dates, passenger counts and cabin.
2. One-way searches show only outbound options. Round-trip searches first ask the customer to select an outbound flight, then show a separate return-flight selection for the reverse route and return date.
3. After the required legs are selected, the customer sees a complete itinerary, base fare, an illustrative tax estimate and a total for the selected passenger count.
4. Customer can submit a booking request or save the complete itinerary to their authenticated profile.
5. The dashboard has separate **Saved Flights** and **My Flight Bookings** areas. Saved itineraries retain both legs for round trips, can be removed, and can reopen the search with the route, dates, passengers and cabin prefilled.
6. A booking request is stored as pending confirmation. It is not a ticket, seat reservation, payment or PNR.

## Fare and tax limitations

The current UI uses a 5% illustrative tax estimate solely to demonstrate the total-price breakdown. It is not a statement of applicable airline GST, airport charges, convenience fees or final payable amount. Saved fares are snapshots. **Recheck options** currently restores the search criteria and shows the mock inventory again; it does not query live prices.

To automatically detect changed schedules, availability, fares and taxes, connect an approved live flight supplier API through a trusted server-side adapter. The adapter must revalidate the entire itinerary (both legs for a round trip) before any final booking/payment step. A one-click ticket purchase also requires a secure payment gateway and trusted ticketing/PNR workflow.

## Future provider adapter

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
