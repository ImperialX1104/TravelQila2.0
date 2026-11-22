# Flight booking requests and saved flights — Supabase setup

The flight page and customer dashboard use two Supabase tables:

- `public.flight_bookings` stores booking requests created by the signed-in customer.
- `public.flight_wishlists` stores the customer's saved complete itinerary (outbound and, for round trips, return flight).

## Apply the migration

1. Open the Supabase project connected in `js/auth-config.js`.
2. Open **SQL Editor**.
3. Run the complete contents of `supabase/flight-bookings.sql`.
4. Confirm both tables exist and Row Level Security is enabled.
5. Sign in with two separate disposable test accounts.
6. Account A: search a round trip, select an outbound flight, select a separate return flight, review the fare summary, then save to wishlist.
7. Confirm both selected legs appear under Account A's **Saved Flights** dashboard section.
8. Use **Recheck options** on the saved itinerary. The flight search form should reopen with route, dates, passengers and cabin prefilled.
9. From Account A, submit a booking request and confirm it appears under **My Flight Bookings**.
10. Sign out and sign in as Account B. Confirm neither Account A's saved flights nor bookings are visible. Attempting to query Account A's rows as Account B must return no rows.

## Customer journey

- Round trip: select an outbound flight, then select a separate return flight on the return date. Only after both selections does the customer see the complete itinerary and total estimate.
- One way: select one outbound flight; no return date or return leg is requested.
- Review: displays each selected leg, base fare, illustrative taxes and total estimate for the selected passenger count.
- Save to wishlist: stores the complete itinerary snapshot against the authenticated user's Supabase Auth UUID.
- Request booking: creates a pending booking request. The dashboard stores and displays both legs and the request reference.
- Recheck options: opens the search with saved criteria and the saved item ID. After selecting fresh options, **Update saved trip** replaces that customer's wishlist snapshot.
- Remove from wishlist: deletes only the signed-in customer's saved item.

## Important current limitation

The current inventory is generated demo data. The 5% tax line is an illustrative UI calculation only, not a representation of the applicable airline GST, airport charges, convenience fees or a final payable amount. A saved fare is a snapshot and is not live inventory.

The **Recheck options** action reopens the search with the saved search details prefilled. It does not query an airline. To automatically refresh availability, flight details, fare and taxes—and then allow a guaranteed one-click ticket purchase—Travel Qila must connect an approved live flight supplier API and trusted server-side booking/payment/ticketing workflow. Until then, a dashboard **Request this trip** action creates a pending enquiry only; it does not reserve a seat, charge a card or issue a PNR/e-ticket.

## Security model

- Customers can SELECT only their own booking requests and wishlist rows.
- Customers can INSERT only rows with their own `user_id`.
- Customers can UPDATE and DELETE only their own wishlist rows; updates are limited to the saved title and itinerary snapshot.
- Customers cannot change booking status or update booking requests through the browser. They can refresh only their own saved itinerary snapshot.
- Actual ticket confirmation/cancellation must be performed by a trusted server-side workflow.

Never put Supabase service-role keys or airline-provider secrets in browser code.
