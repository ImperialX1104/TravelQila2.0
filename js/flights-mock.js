
import { supabase } from "./auth-client.js";

(() => {
  "use strict";

  const form = document.getElementById("flightSearchForm");
  const results = document.getElementById("flightResults");
  if (!form || !results) return;

  // DEMO PRICING CONFIGURATION
  const FARE_CONFIG = {
    adultMultiplier: 1,
    childMultiplier: 0.75,
    infantMultiplier: 0.25,
    taxRate: 0.05,
    currency: "INR"
  };

  const airportMap = {
    DEL:"New Delhi", BOM:"Mumbai", BLR:"Bengaluru",
    HYD:"Hyderabad", MAA:"Chennai", CCU:"Kolkata",
    GOI:"Goa", AMD:"Ahmedabad", PNQ:"Pune",
    COK:"Kochi", JAI:"Jaipur", DXB:"Dubai",
    SIN:"Singapore", BKK:"Bangkok", LHR:"London",
    DOH:"Doha", AUH:"Abu Dhabi", KUL:"Kuala Lumpur",
    HKT:"Phuket", JFK:"New York"
  };

  const sampleOffers = [
    {airline:"IndiGo",flight:"6E 2145",depart:"06:10",duration:135,stops:0,price:6450,baggage:"15 kg check-in"},
    {airline:"Air India",flight:"AI 887",depart:"07:35",duration:150,stops:0,price:7850,baggage:"15 kg check-in"},
    {airline:"Akasa Air",flight:"QP 1320",depart:"09:20",duration:150,stops:0,price:6990,baggage:"15 kg check-in"},
    {airline:"Air India Express",flight:"IX 1042",depart:"11:45",duration:205,stops:1,price:5980,baggage:"15 kg check-in"},
    {airline:"IndiGo",flight:"6E 6087",depart:"13:15",duration:155,stops:0,price:7350,baggage:"15 kg check-in"},
    {airline:"Air India",flight:"AI 441",depart:"16:40",duration:225,stops:1,price:8250,baggage:"25 kg check-in"},
    {airline:"Akasa Air",flight:"QP 1718",depart:"18:30",duration:155,stops:0,price:7590,baggage:"15 kg check-in"},
    {airline:"IndiGo",flight:"6E 9912",depart:"21:15",duration:215,stops:1,price:6250,baggage:"15 kg check-in"}
  ];

  const byId = id => document.getElementById(id);

  const safe = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;", "<":"&lt;", ">":"&gt;",
      '"':"&quot;", "'":"&#39;"
    }[c]));

  const money = value =>
    "₹" + Number(value || 0).toLocaleString("en-IN", {
      maximumFractionDigits: 2
    });

  const durationText = minutes =>
    Math.floor(minutes / 60) + "h " +
    (minutes % 60 ? minutes % 60 + "m" : "");

  const formatDate = value =>
    value ? new Date(value + "T12:00:00").toLocaleDateString(
      "en-IN", {day:"numeric", month:"short", year:"numeric"}
    ) : "";

  const shiftDate = (value, days) => {
    const d = new Date(value + "T12:00:00");
    d.setDate(d.getDate() + days);
    return d.getFullYear() + "-" +
      String(d.getMonth() + 1).padStart(2, "0") + "-" +
      String(d.getDate()).padStart(2, "0");
  };

  const addMinutes = (time, minutes) => {
    const p = time.split(":").map(Number);
    const n = (p[0] * 60 + p[1] + minutes) % 1440;
    return String(Math.floor(n / 60)).padStart(2, "0") +
      ":" + String(n % 60).padStart(2, "0");
  };

  function parseAirport(value) {
    const m = String(value).trim().match(/\(([A-Za-z]{3})\)\s*$/);
    const code = m ? m[1].toUpperCase() : "";
    const city = String(value).trim().replace(/\s*\([A-Za-z]{3}\)\s*$/, "");

    return {
      city: city || value,
      code,
      label: code ? (airportMap[code] || city) : city
    };
  }

  let search = null;
  let outboundOptions = [];
  let returnOptions = [];
  let selectedOutbound = null;
  let selectedReturn = null;
  let stage = "outbound";
  let wishlistId = null;

  function updateTripType() {
    const round =
      form.querySelector('input[name="tripType"]:checked').value === "Round trip";

    const wrap = byId("returnDate");
    const container = byId("returnDateWrap");

    container.hidden = !round;
    wrap.required = round;

    if (!round) wrap.value = "";
  }

  function makeOptions(origin, destination, date, seedText) {
    const seed = seedText.split("").reduce(
      (n, c) => n + c.charCodeAt(0), 0
    );

    return sampleOffers.map((x, i) => {
      const shift = seed % 7;
      const depart = addMinutes(x.depart, shift * 4);
      const duration = x.duration + shift * 3 + (i % 2 ? 10 : 0);

      const flex = search?.dateFlexibility || "Exact dates";

      const offsets =
        flex === "1 day before or after"
          ? [0, -1, 1, 0, 0, 0, 0, 0]
          : flex === "3 days before or after" ||
            flex === "Flexible - lowest fare matters most"
            ? [0, -1, 1, -2, 2, -3, 3, 0]
            : [0, 0, 0, 0, 0, 0, 0, 0];

      const dateOffset = offsets[i] || 0;

      const price = Math.round((
        x.price +
        (seed % 13) * 175 +
        (i % 3) * 260 +
        (dateOffset < 0
          ? Math.abs(dateOffset) * -80
          : dateOffset * 40)
      ) / 10) * 10;

      return {
        id: "leg-" + seed + "-" + i,
        airline: x.airline,
        flight: x.flight,
        depart,
        arrive: addMinutes(depart, duration),
        duration,
        stops: x.stops,
        price,
        baggage: x.baggage,
        origin,
        destination,
        departureDate: shiftDate(date, dateOffset)
      };
    });
  }

  function passengers() {
    return search.adults + search.children + search.infants;
  }

  // CATEGORY-WISE FARE ENGINE
  function pricing() {
    const outboundFare = selectedOutbound?.price || 0;
    const returnFare = selectedReturn?.price || 0;

    const categories = [
      {
        key: "adults",
        label: "Adults",
        count: search.adults,
        multiplier: FARE_CONFIG.adultMultiplier
      },
      {
        key: "children",
        label: "Children",
        count: search.children,
        multiplier: FARE_CONFIG.childMultiplier
      },
      {
        key: "infants",
        label: "Infants",
        count: search.infants,
        multiplier: FARE_CONFIG.infantMultiplier
      }
    ];

    const breakdown = categories.map(category => {
      const adultOutbound = Math.round(
        outboundFare * category.multiplier
      );

      const adultReturn = Math.round(
        returnFare * category.multiplier
      );

      const outboundTotal = adultOutbound * category.count;
      const returnTotal = adultReturn * category.count;

      return {
        key: category.key,
        label: category.label,
        count: category.count,
        multiplier: category.multiplier,
        outboundPerPerson: adultOutbound,
        returnPerPerson: adultReturn,
        outboundTotal,
        returnTotal,
        subtotal: outboundTotal + returnTotal
      };
    });

    const baseFare = breakdown.reduce(
      (sum, item) => sum + item.subtotal, 0
    );

    const taxAmount = Math.round(
      baseFare * FARE_CONFIG.taxRate
    );

    return {
      baseFare,
      taxAmount,
      totalFare: baseFare + taxAmount,
      taxRate: FARE_CONFIG.taxRate,
      currency: FARE_CONFIG.currency,
      categories: breakdown,
      outboundAdultFare: outboundFare,
      returnAdultFare: returnFare,
      pricingModel: "illustrative_category_based"
    };
  }

  function itinerary() {
    const p = pricing();

    return {
      version: 2,
      origin: search.origin,
      destination: search.destination,
      tripType: search.tripType,
      departureDate: selectedOutbound?.departureDate || search.departureDate,
      returnDate: search.tripType === "Round trip"
        ? (selectedReturn?.departureDate || search.returnDate)
        : null,
      stops: search.stops,
      maximumBudget: search.maximumBudget,
      dateFlexibility: search.dateFlexibility,
      additionalPreferences: search.additionalPreferences,
      passengers: {
        adults: search.adults,
        children: search.children,
        infants: search.infants
      },
      cabin: search.cabin,
      outbound: selectedOutbound,
      return: selectedReturn,
      pricing: p,
      priceSource: "illustrative_demo",
      savedAt: new Date().toISOString()
    };
  }

  function optionsMarkup(items, leg) {
    return items.map(o =>
      '<article class="flight-result-card tq-leg-card">' +
        '<div class="flight-result-top">' +
          '<div>' +
            '<div class="flight-airline-name">' + safe(o.airline) + '</div>' +
            '<div class="flight-flight-number">' + safe(o.flight) +
              ' · ' + (o.stops === 0 ? "Non-stop" : o.stops + " stop") +
            '</div>' +
          '</div>' +
          '<div class="flight-demo-price">' +
            '<strong>' + money(o.price) + '</strong>' +
            '<small>Adult demo fare / passenger</small>' +
          '</div>' +
        '</div>' +
        '<div class="flight-route-line">' +
          '<div><div class="flight-time">' + safe(o.depart) + '</div>' +
            '<div class="flight-city">' + safe(o.origin.label) +
              ' (' + safe(o.origin.code || "—") + ')</div></div>' +
          '<div class="flight-route-middle">' +
            '<div>' + durationText(o.duration) + '</div>' +
            '<div class="line"></div>' +
            '<div>' + (o.stops === 0 ? "Non-stop" : o.stops + " stop") + '</div>' +
          '</div>' +
          '<div class="text-end"><div class="flight-time">' + safe(o.arrive) + '</div>' +
            '<div class="flight-city">' + safe(o.destination.label) +
              ' (' + safe(o.destination.code || "—") + ')</div></div>' +
        '</div>' +
        '<div class="flight-result-meta">' +
          '<span><i class="far fa-calendar"></i>' + formatDate(o.departureDate) + '</span>' +
          '<span><i class="fas fa-suitcase"></i>' + safe(o.baggage) + '</span>' +
          '<span><i class="fas fa-chair"></i>' + safe(search.cabin) + '</span>' +
        '</div>' +
        '<div class="flight-result-actions">' +
          '<button type="button" class="flight-select-leg" data-select-leg="' +
            leg + '" data-offer-id="' + o.id + '">' +
            'Select this ' + (leg === "outbound" ? "departure" : "return") +
            ' flight <i class="fas fa-arrow-right ms-1"></i>' +
          '</button>' +
        '</div>' +
      '</article>'
    ).join("");
  }

  function filtersMarkup() {
    const preferred =
      search.stops === "Non-stop only" ? "nonstop" :
      search.stops === "1 stop or fewer" ? "one" : "any";

    return '<div class="flight-results-tools">' +
      '<label for="resultStops">Stops</label>' +
      '<select id="resultStops">' +
        '<option value="any" ' + (preferred === "any" ? "selected" : "") + '>Any stops</option>' +
        '<option value="nonstop" ' + (preferred === "nonstop" ? "selected" : "") + '>Non-stop</option>' +
        '<option value="one" ' + (preferred === "one" ? "selected" : "") + '>Up to 1 stop</option>' +
      '</select>' +
      '<label for="resultAirline">Airline</label>' +
      '<select id="resultAirline">' +
        '<option value="all">All airlines</option>' +
        '<option>IndiGo</option>' +
        '<option>Air India</option>' +
        '<option>Akasa Air</option>' +
        '<option>Air India Express</option>' +
      '</select>' +
      '<label for="resultSort">Sort by</label>' +
      '<select id="resultSort">' +
        '<option value="price">Lowest fare</option>' +
        '<option value="duration">Shortest duration</option>' +
        '<option value="departure">Departure time</option>' +
      '</select>' +
      '<span class="small text-muted">Budget: ' +
        money(search.maximumBudget) + ' per passenger</span>' +
    '</div>';
  }

  function filteredOptions(items, leg) {
    const stops = byId("resultStops")?.value || "any";
    const airline = byId("resultAirline")?.value || "all";
    const sort = byId("resultSort")?.value || "price";

    const preference = search.stops || "Any";
    const max = Number(search.maximumBudget) || Infinity;

    const stopAllowed = o =>
      (preference === "Any" ||
        (preference === "Non-stop only" && o.stops === 0) ||
        (preference === "1 stop or fewer" && o.stops <= 1)) &&
      (stops === "any" ||
        (stops === "nonstop" && o.stops === 0) ||
        (stops === "one" && o.stops <= 1));

    const minimumOther =
      leg === "outbound" && search.tripType === "Round trip"
        ? Math.min(...returnOptions.map(x => x.price))
        : 0;

    const committed =
      leg === "return" ? (selectedOutbound?.price || 0) : 0;

    const out = items.filter(o =>
      stopAllowed(o) &&
      (airline === "all" || o.airline === airline) &&
      ((committed + o.price + minimumOther) * 1.05) <= max
    );

    out.sort((a, b) =>
      sort === "duration" ? a.duration - b.duration :
      sort === "departure" ? a.depart.localeCompare(b.depart) :
      a.price - b.price
    );

    return out;
  }

  function heading(title, sub) {
    byId("resultRoute").textContent = title;
    byId("resultDates").textContent = sub;
  }

  function renderLegStage() {
    const isReturn = stage === "return";

    const items = filteredOptions(
      isReturn ? returnOptions : outboundOptions,
      isReturn ? "return" : "outbound"
    );

    const from = isReturn ? search.destination : search.origin;
    const to = isReturn ? search.origin : search.destination;

    heading(
      (isReturn ? "Choose your return flight" : "Choose your departure flight") +
      " · " + from.label + " → " + to.label,
      formatDate(isReturn ? search.returnDate : search.departureDate) +
      " · " + search.tripType + " · " + passengers() + " passenger(s)"
    );

    const stepper =
      '<div class="tq-booking-steps">' +
        '<span class="' + (stage === "outbound" ? "is-active" : "is-done") + '">1. Departure</span>' +
        (search.tripType === "Round trip"
          ? '<span class="' + (stage === "return" ? "is-active" : "") + '">2. Return</span>'
          : "") +
        '<span> ' + (search.tripType === "Round trip" ? "3" : "2") + '. Review & save</span>' +
      '</div>';

    const back = isReturn
      ? '<button type="button" class="btn btn-outline-secondary rounded-pill mb-3" data-back-outbound>' +
          '<i class="fas fa-arrow-left me-1"></i>Change departure flight</button>'
      : "";

    byId("flightResultsList").innerHTML =
      stepper + back + filtersMarkup() +
      (items.length
        ? optionsMarkup(items, isReturn ? "return" : "outbound")
        : '<div class="flight-empty is-visible">No flights match these filters. Try another airline or stop preference.</div>');

    byId("flightResultsEmpty").classList.remove("is-visible");
    byId("flightResultsList").hidden = false;

    ["resultStops", "resultAirline", "resultSort"].forEach(id => {
      byId(id)?.addEventListener("change", renderLegStage);
    });

    byId("flightResultsCount").textContent =
      items.length + " demo flight options";
  }

  // CATEGORY-WISE FARE DISPLAY
  function fareBreakdownMarkup(p) {
    const rows = p.categories
      .filter(item => item.count > 0)
      .map(item => {
        const tripFarePerPerson =
          item.outboundPerPerson + item.returnPerPerson;

        return '<div class="tq-fare-category">' +
          '<div><strong>' + item.label + ' (' + item.count + ')</strong>' +
          '<small>' + item.count + ' × ' + money(tripFarePerPerson) +
            ' per passenger' +
            (search.tripType === "Round trip" ? ' · outbound + return' : ' · one way') +
          '</small></div>' +
          '<strong>' + money(item.subtotal) + '</strong>' +
        '</div>';
      }).join("");

    return '<div class="tq-price-breakdown">' +
      '<h5 class="mb-3">Passenger fare breakdown</h5>' +
      (rows || '<div>No passengers selected.</div>') +
      '<hr>' +
      '<div><span>Base fare · all passengers</span><strong>' +
        money(p.baseFare) + '</strong></div>' +
      '<div><span>Estimated taxes & fees (illustrative 5%)</span><strong>' +
        money(p.taxAmount) + '</strong></div>' +
      '<div class="tq-grand-total"><span>Estimated total</span><strong>' +
        money(p.totalFare) + '</strong></div>' +
      '<small>Demo estimate only. Adult fare is 100%, child fare is 75%, and infant fare is 25% of the adult demo fare. These are illustrative assumptions, not actual airline fare rules. Actual taxes, fees, availability and airline pricing must be reconfirmed before payment.</small>' +
    '</div>';
  }

  function renderSummary() {
    const trip = itinerary();
    const p = trip.pricing;

    const leg = (o, label) =>
      '<div class="tq-summary-leg">' +
        '<div class="tq-summary-leg-title">' +
          label + ' · ' + formatDate(o.departureDate) +
        '</div>' +
        '<strong>' + safe(o.airline) + ' · ' + safe(o.flight) + '</strong>' +
        '<div class="tq-summary-route">' +
          safe(o.origin.label) + ' (' + safe(o.origin.code || "—") + ')' +
          ' <i class="fas fa-arrow-right"></i> ' +
          safe(o.destination.label) + ' (' + safe(o.destination.code || "—") + ')' +
        '</div>' +
        '<div class="tq-summary-times">' +
          safe(o.depart) + ' – ' + safe(o.arrive) +
          ' · ' + durationText(o.duration) +
        '</div>' +
        '<div class="tq-summary-fare">' +
          money(o.price) + ' adult fare per passenger' +
        '</div>' +
      '</div>';

    const legs =
      leg(selectedOutbound, "Outbound") +
      (selectedReturn ? leg(selectedReturn, "Return") : "");

    const html =
      '<div class="tq-booking-steps">' +
        '<span class="is-done">1. Departure</span>' +
        (search.tripType === "Round trip"
          ? '<span class="is-done">2. Return</span>' : "") +
        '<span class="is-active">Review & save</span>' +
      '</div>' +

      '<div class="tq-summary-card">' +
        '<div class="tq-summary-heading">' +
          '<div>' +
            '<span class="flight-eyebrow text-primary">YOUR ITINERARY</span>' +
            '<h3>' + safe(search.origin.label) + ' ↔ ' +
              safe(search.destination.label) + '</h3>' +
            '<p>' + search.tripType + ' · ' + passengers() +
              ' passenger(s) · ' + safe(search.cabin) + '</p>' +
          '</div>' +
          '<button type="button" class="btn btn-link" data-edit-flights>Edit flights</button>' +
        '</div>' +

        legs +

        fareBreakdownMarkup(p) +

        '<div class="tq-summary-actions">' +
          '<button type="button" class="btn btn-primary" data-book-itinerary>' +
            '<i class="fas fa-lock me-2"></i>Request booking</button>' +
          '<button type="button" class="btn btn-outline-primary" data-save-wishlist>' +
            '<i class="far fa-heart me-2"></i>' +
            (wishlistId ? "Update saved trip" : "Save to wishlist") +
          '</button>' +
          '<button type="button" class="btn btn-outline-primary" data-share-itinerary="whatsapp">' +
            '<i class="fab fa-whatsapp me-2"></i>WhatsApp</button>' +
          '<button type="button" class="btn btn-outline-primary" data-share-itinerary="email">' +
            '<i class="far fa-envelope me-2"></i>Email</button>' +
        '</div>' +

        '<p class="small text-muted mt-3 mb-0" data-itinerary-message>' +
          'Choose Request booking to send this selected itinerary to Travel Qila, or save it to your profile for later.' +
        '</p>' +
      '</div>';

    byId("flightResultsList").innerHTML = html;
    byId("flightResultsCount").textContent = "Complete itinerary selected";
    byId("flightResultsEmpty").classList.remove("is-visible");
    byId("flightResultsList").hidden = false;

    heading(
      "Review your trip",
      formatDate(search.departureDate) +
      (search.tripType === "Round trip"
        ? " · Return " + formatDate(search.returnDate)
        : " · One way")
    );
  }

  function showStage() {
    if (stage === "summary") renderSummary();
    else renderLegStage();
  }

  function resetFilters() {
    ["resultStops", "resultAirline", "resultSort"].forEach(id => {
      const el = byId(id);
      if (el) {
        el.value =
          id === "resultStops" ? "any" :
          id === "resultAirline" ? "all" : "price";
      }
    });
  }

  async function signedInUser() {
    const {data, error} = await supabase.auth.getUser();

    if (error) throw error;
    if (!data.user) {
      throw new Error("Please sign in to save or request this itinerary.");
    }

    return data.user;
  }

  function messageNode() {
    return byId("itinerary-message") ||
      document.querySelector("[data-itinerary-message]");
  }

  async function saveWishlist() {
    const node = messageNode();
    const btn = byId("save-wishlist");
    const original = btn?.innerHTML;

    if (btn) {
      btn.disabled = true;
      btn.textContent = "Saving to wishlist…";
    }

    try {
      const user = await signedInUser();
      const trip = itinerary();
      const title = search.origin.label + " to " + search.destination.label;

      let error;

      if (wishlistId) {
        const result = await supabase
          .from("flight_wishlists")
          .update({title, itinerary:trip})
          .eq("id", wishlistId)
          .eq("user_id", user.id)
          .select("id")
          .single();

        error = result.error;
      } else {
        const result = await supabase
          .from("flight_wishlists")
          .insert({user_id:user.id, title, itinerary:trip});

        error = result.error;
      }

      if (error) throw error;

      if (node) {
        node.textContent = wishlistId
          ? "Your saved trip has been updated with the new fare breakdown."
          : "Saved to your wishlist. Find it in your dashboard whenever you're ready.";
      }

      if (btn) {
        btn.textContent = wishlistId ? "Saved trip updated" : "Saved to wishlist";
        btn.disabled = true;
      }
    } catch (e) {
      if (node) {
        node.innerHTML = safe(e.message) +
          (e.message.includes("sign in") ? ' <a href="login.html">Sign in</a>' : "");
      }

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = original;
      }
    }
  }

  async function requestBooking(trip, user) {
    const o = trip.outbound;
    const r = trip.return;
    const p = trip.pricing;
    const s = trip;

    const payload = {
      user_id:user.id,
      origin:s.origin.label,
      destination:s.destination.label,
      origin_code:s.origin.code || null,
      destination_code:s.destination.code || null,
      trip_type:s.tripType,
      departure_date:s.departureDate,
      return_date:s.tripType === "Round trip" ? s.returnDate : null,
      adults:s.passengers.adults,
      children:s.passengers.children,
      infants:s.passengers.infants,
      cabin_class:s.cabin,
      airline:o.airline,
      flight_number:o.flight,
      departure_time:o.depart,
      arrival_time:o.arrive,
      return_airline:r?.airline || null,
      return_flight_number:r?.flight || null,
      return_departure_time:r?.depart || null,
      return_arrival_time:r?.arrive || null,
      base_fare:p.baseFare,
      tax_amount:p.taxAmount,
      demo_fare:p.totalFare,
      additional_preferences:s.additionalPreferences || null
    };

    const {data, error} = await supabase
      .from("flight_bookings")
      .insert(payload)
      .select("booking_reference")
      .single();

    if (error) throw error;
    return data.booking_reference;
  }

  function shareItinerary(channel) {
    const trip = itinerary();
    const p = trip.pricing;
    const o = trip.outbound;
    const r = trip.return;

    const lines = [
      "Hello Travel Qila, I would like to request this flight itinerary.",
      "Trip: " + trip.tripType,
      "Route: " + trip.origin.label + " (" + (trip.origin.code || "") +
        ") to " + trip.destination.label + " (" + (trip.destination.code || "") + ")",
      "Departure: " + formatDate(trip.departureDate),
      trip.tripType === "Round trip" ? "Return: " + formatDate(trip.returnDate) : "",
      "Passengers: " + trip.passengers.adults + " adult(s), " +
        trip.passengers.children + " child(ren), " +
        trip.passengers.infants + " infant(s)",
      "Cabin: " + trip.cabin,
      "Outbound: " + o.airline + " " + o.flight + " | " +
        o.depart + "–" + o.arrive + " | " + money(o.price) + " adult fare",
      r ? "Return flight: " + r.airline + " " + r.flight + " | " +
        r.depart + "–" + r.arrive + " | " + money(r.price) + " adult fare" : "",
      "Passenger category breakdown:",
      ...p.categories
        .filter(item => item.count > 0)
        .map(item => item.label + " (" + item.count + "): " + money(item.subtotal)),
      "Base fare: " + money(p.baseFare),
      "Illustrative tax estimate: " + money(p.taxAmount),
      "Estimated demo total: " + money(p.totalFare),
      trip.additionalPreferences
        ? "Additional preferences: " + trip.additionalPreferences : "",
      "Please reconfirm live availability, final fare, taxes and terms. This is an enquiry, not a confirmed ticket."
    ].filter(Boolean);

    const message = lines.join("\n");

    if (channel === "whatsapp") {
      window.open(
        "https://wa.me/919871101345?text=" + encodeURIComponent(message),
        "_blank",
        "noopener,noreferrer"
      );
    } else if (channel === "email") {
      window.location.href =
        "mailto:info@travelqila.com?subject=" +
        encodeURIComponent("Travel Qila - Flight booking enquiry") +
        "&body=" + encodeURIComponent(message);
    }
  }

  async function bookCurrent() {
    const node = messageNode();
    const button = byId("book-itinerary");

    if (button) {
      button.disabled = true;
      button.textContent = "Submitting…";
    }

    try {
      const user = await signedInUser();
      const ref = await requestBooking(itinerary(), user);

      if (node) {
        node.textContent =
          "Booking request " + ref +
          " is in your dashboard. Travel Qila must reconfirm live availability and final fare before ticketing.";
      }

      if (button) button.textContent = "Request submitted";
    } catch (e) {
      if (node) {
        node.innerHTML = safe(e.message) +
          (e.message.includes("sign in") ? ' <a href="login.html">Sign in</a>' : "");
      }

      if (button) {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-lock me-2"></i>Request booking';
      }
    }
  }

  results.addEventListener("click", async event => {
    const target = event.target.closest("button");
    if (!target) return;

    if (target.hasAttribute("data-select-leg")) {
      const id = target.dataset.offerId;
      const leg = target.dataset.selectLeg;
      const options = leg === "return" ? returnOptions : outboundOptions;
      const selected = options.find(x => x.id === id);

      if (!selected) return;

      if (leg === "outbound") {
        selectedOutbound = selected;

        if (search.tripType === "Round trip") {
          stage = "return";
          resetFilters();
        } else {
          selectedReturn = null;
          stage = "summary";
        }
      } else {
        selectedReturn = selected;
        stage = "summary";
      }

      showStage();
      results.scrollIntoView({behavior:"smooth", block:"start"});

    } else if (target.hasAttribute("data-back-outbound")) {
      stage = "outbound";
      selectedReturn = null;
      resetFilters();
      showStage();

    } else if (target.hasAttribute("data-edit-flights")) {
      stage = selectedOutbound && search.tripType === "Round trip"
        ? "return" : "outbound";
      resetFilters();
      showStage();

    } else if (target.hasAttribute("data-save-wishlist")) {
      target.id = "save-wishlist";
      await saveWishlist();

    } else if (target.hasAttribute("data-book-itinerary")) {
      target.id = "book-itinerary";
      await bookCurrent();

    } else if (target.hasAttribute("data-share-itinerary")) {
      shareItinerary(target.dataset.shareItinerary);
    }
  });

  form.querySelectorAll('input[name="tripType"]').forEach(x =>
    x.addEventListener("change", updateTripType)
  );

  byId("departDate").addEventListener("change", () => {
    byId("returnDate").min = byId("departDate").value;
  });

  byId("swapCities").addEventListener("click", () => {
    const a = byId("origin");
    const b = byId("destination");
    const v = a.value;
    a.value = b.value;
    b.value = v;
  });

  form.addEventListener("submit", event => {
    event.preventDefault();
    updateTripType();

    if (!form.reportValidity()) return;

    const origin = parseAirport(byId("origin").value);
    const destination = parseAirport(byId("destination").value);

    if (
      origin.city.toLowerCase() === destination.city.toLowerCase() ||
      (origin.code && origin.code === destination.code)
    ) {
      byId("destination").setCustomValidity(
        "Choose a different arrival airport."
      );
      byId("destination").reportValidity();
      byId("destination").setCustomValidity("");
      return;
    }

    const adults = Number(byId("adults").value);
    const children = Number(byId("children").value);
    const infants = Number(byId("infants").value);

    if (adults < 1 || children < 0 || infants < 0) {
      alert("Please enter valid passenger counts.");
      return;
    }

    if (infants > adults) {
      byId("infants").setCustomValidity(
        "Infants cannot exceed the number of adults."
      );
      byId("infants").reportValidity();
      byId("infants").setCustomValidity("");
      return;
    }

    const tripType =
      form.querySelector('input[name="tripType"]:checked').value;

    if (
      tripType === "Round trip" &&
      byId("returnDate").value < byId("departDate").value
    ) {
      byId("returnDate").setCustomValidity(
        "Return date must be on or after the departure date."
      );
      byId("returnDate").reportValidity();
      byId("returnDate").setCustomValidity("");
      return;
    }

    search = {
      origin,
      destination,
      departureDate:byId("departDate").value,
      returnDate:tripType === "Round trip"
        ? byId("returnDate").value : null,
      tripType,
      adults,
      children,
      infants,
      cabin:byId("cabin").value,
      stops:byId("stops").value,
      maximumBudget:Number(byId("maxPrice").value),
      dateFlexibility:byId("flexibility").value,
      additionalPreferences:byId("notes").value.trim()
    };

    selectedOutbound = null;
    selectedReturn = null;
    stage = "outbound";

    outboundOptions = makeOptions(
      origin, destination, search.departureDate,
      origin.code + destination.code
    );

    returnOptions = tripType === "Round trip"
      ? makeOptions(
          destination, origin, search.returnDate,
          destination.code + origin.code
        )
      : [];

    byId("flightResultsCount").textContent =
      "Choose your departure flight";

    results.hidden = false;
    showStage();
    results.scrollIntoView({behavior:"smooth", block:"start"});
  });

  const params = new URLSearchParams(window.location.search);
  wishlistId = params.get("wishlistId") || null;

  if (params.has("origin") && params.has("destination")) {
    byId("origin").value = params.get("origin") || "";
    byId("destination").value = params.get("destination") || "";

    const trip = params.get("tripType") === "Round trip"
      ? "Round trip" : "One way";

    const radio = form.querySelector(
      'input[name="tripType"][value="' + trip + '"]'
    );

    if (radio) radio.checked = true;

    byId("departDate").value = params.get("departureDate") || "";
    byId("returnDate").value = params.get("returnDate") || "";

    ["adults", "children", "infants"].forEach(id => {
      const value = params.get(id);
      if (value !== null && byId(id)) byId(id).value = value;
    });

    if (params.get("cabin")) {
      byId("cabin").value = params.get("cabin");
    }
  }

  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  const today = now.toISOString().slice(0, 10);

  byId("departDate").min = today;
  byId("returnDate").min = today;

  const budget = byId("maxPrice");
  const budgetOutput = byId("priceOutput");

  const syncBudget = () => {
    if (budgetOutput) {
      budgetOutput.textContent = money(budget.value);
    }
  };

  if (budget) budget.addEventListener("input", syncBudget);

  if (params.has("stops") && byId("stops")) {
    byId("stops").value = params.get("stops");
  }

  if (params.has("maximumBudget") && budget) {
    budget.value = params.get("maximumBudget");
  }

  if (params.has("dateFlexibility") && byId("flexibility")) {
    byId("flexibility").value = params.get("dateFlexibility");
  }

  if (params.has("additionalPreferences") && byId("notes")) {
    byId("notes").value = params.get("additionalPreferences");
  }

  syncBudget();
  updateTripType();

  if (byId("departDate").value) {
    byId("returnDate").min = byId("departDate").value;
  }

  if (
    params.has("origin") &&
    params.has("destination") &&
    params.has("departureDate")
  ) {
    const validOrigin = byId("origin").value.trim();
    const validDestination = byId("destination").value.trim();
    const validDeparture = byId("departDate").value;

    const validReturn =
      form.querySelector('input[name="tripType"]:checked').value !== "Round trip" ||
      !!byId("returnDate").value;

    if (validOrigin && validDestination && validDeparture && validReturn) {
      form.requestSubmit();
    }
  }
})();
