
import { supabase } from "./auth-client.js";

(() => {
  "use strict";

  const form = document.getElementById("flightSearchForm");
  const results = document.getElementById("flightResults");

  if (!form || !results) return;

  // ==========================================
  // CONFIGURATION
  // ==========================================

  const FARE_CONFIG = Object.freeze({
    taxRate: 0.05,
    currency: "INR",
    currencyLocale: "en-IN",
    priceSource: "illustrative_demo"
  });

  const airportMap = {
    DEL: "New Delhi",
    BOM: "Mumbai",
    BLR: "Bengaluru",
    HYD: "Hyderabad",
    MAA: "Chennai",
    CCU: "Kolkata",
    GOI: "Goa",
    AMD: "Ahmedabad",
    PNQ: "Pune",
    COK: "Kochi",
    JAI: "Jaipur",
    DXB: "Dubai",
    SIN: "Singapore",
    BKK: "Bangkok",
    LHR: "London",
    DOH: "Doha",
    AUH: "Abu Dhabi",
    KUL: "Kuala Lumpur",
    HKT: "Phuket",
    JFK: "New York"
  };

  const sampleOffers = [
    { airline: "IndiGo", flight: "6E 2145", depart: "06:10", duration: 135, stops: 0, price: 6450, baggage: "15 kg check-in" },
    { airline: "Air India", flight: "AI 887", depart: "07:35", duration: 150, stops: 0, price: 7850, baggage: "15 kg check-in" },
    { airline: "Akasa Air", flight: "QP 1320", depart: "09:20", duration: 150, stops: 0, price: 6990, baggage: "15 kg check-in" },
    { airline: "Air India Express", flight: "IX 1042", depart: "11:45", duration: 205, stops: 1, price: 5980, baggage: "15 kg check-in" },
    { airline: "IndiGo", flight: "6E 6087", depart: "13:15", duration: 155, stops: 0, price: 7350, baggage: "15 kg check-in" },
    { airline: "Air India", flight: "AI 441", depart: "16:40", duration: 225, stops: 1, price: 8250, baggage: "25 kg check-in" },
    { airline: "Akasa Air", flight: "QP 1718", depart: "18:30", duration: 155, stops: 0, price: 7590, baggage: "15 kg check-in" },
    { airline: "IndiGo", flight: "6E 9912", depart: "21:15", duration: 215, stops: 1, price: 6250, baggage: "15 kg check-in" }
  ];

  // ==========================================
  // UTILITIES
  // ==========================================

  const byId = id => document.getElementById(id);

  const safe = value =>
    String(value ?? "").replace(/[&<>"']/g, character => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[character]);

  const money = value =>
    new Intl.NumberFormat(FARE_CONFIG.currencyLocale, {
      style: "currency",
      currency: FARE_CONFIG.currency,
      maximumFractionDigits: 0
    }).format(Number(value) || 0);

  const durationText = minutes => {
    const hours = Math.floor(minutes / 60);
    const remaining = minutes % 60;

    return hours + "h" + (remaining ? " " + remaining + "m" : "");
  };

  const formatDate = value => {
    if (!value) return "";

    const date = new Date(value + "T12:00:00");

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  };

  function localDateString(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  const shiftDate = (value, days) => {
    const date = new Date(value + "T12:00:00");

    date.setDate(date.getDate() + days);

    return localDateString(date);
  };

  const addMinutes = (time, minutes) => {
    const [hours, mins] = time.split(":").map(Number);
    const total = (hours * 60 + mins + minutes) % 1440;

    return (
      String(Math.floor(total / 60)).padStart(2, "0") +
      ":" +
      String(total % 60).padStart(2, "0")
    );
  };

  function parseAirport(value) {
    const input = String(value || "").trim();
    const match = input.match(/\(([A-Za-z]{3})\)\s*$/);

    const code = match ? match[1].toUpperCase() : "";
    const city = input.replace(/\s*\([A-Za-z]{3}\)\s*$/, "");

    return {
      city: city || input,
      code,
      label: code ? (airportMap[code] || city) : city
    };
  }

  // ==========================================
  // APPLICATION STATE
  // ==========================================

  let search = null;

  let outboundOptions = [];
  let returnOptions = [];

  let selectedOutbound = null;
  let selectedReturn = null;

  let stage = "outbound";
  let wishlistId = null;

  // ==========================================
  // PASSENGER CALCULATIONS
  // ==========================================

  function passengerBreakdown() {
    if (!search) {
      throw new Error("Please search for flights first.");
    }

    const adults = Number(search.adults);
    const children = Number(search.children);
    const infants = Number(search.infants);

    if (
      !Number.isInteger(adults) ||
      !Number.isInteger(children) ||
      !Number.isInteger(infants) ||
      adults < 1 ||
      children < 0 ||
      infants < 0 ||
      infants > adults
    ) {
      throw new Error("Invalid passenger configuration.");
    }

    return {
      adults,
      children,
      infants,
      total: adults + children + infants
    };
  }

  function passengers() {
    return passengerBreakdown().total;
  }

  // ==========================================
  // SMART FARE CALCULATION ENGINE
  // ==========================================

  function calculateFare() {
    if (!selectedOutbound) {
      throw new Error("Please select a departure flight.");
    }

    if (
      search.tripType === "Round trip" &&
      !selectedReturn
    ) {
      throw new Error("Please select a return flight.");
    }

    const passenger = passengerBreakdown();

    const outboundFare = Number(selectedOutbound.price);
    const returnFare = selectedReturn
      ? Number(selectedReturn.price)
      : 0;

    if (
      !Number.isFinite(outboundFare) ||
      outboundFare <= 0 ||
      !Number.isFinite(returnFare) ||
      returnFare < 0
    ) {
      throw new Error("Invalid flight fare detected.");
    }

    // Prices in the mock inventory are per traveller,
    // not the total for the entire passenger group.

    const outboundPerPassenger = Math.round(outboundFare);
    const returnPerPassenger = Math.round(returnFare);

    const basePerPassenger =
      outboundPerPassenger + returnPerPassenger;

    const baseFare = Math.round(
      basePerPassenger * passenger.total
    );

    // Illustrative demo tax. Not actual airline taxes.
    const taxAmount = Math.round(
      baseFare * FARE_CONFIG.taxRate
    );

    const totalFare = baseFare + taxAmount;

    return {
      currency: FARE_CONFIG.currency,

      passengerCount: passenger.total,
      passengerBreakdown: passenger,

      outboundFarePerPassenger: outboundPerPassenger,
      returnFarePerPassenger: returnPerPassenger,

      perPassengerBase: basePerPassenger,

      baseFare,
      taxRate: FARE_CONFIG.taxRate,
      taxAmount,

      totalFare,

      averageFarePerPassenger:
        Math.round(totalFare / passenger.total),

      priceSource: FARE_CONFIG.priceSource
    };
  }

  function pricing() {
    return calculateFare();
  }

  // ==========================================
  // ITINERARY
  // ==========================================

  function itinerary() {
    const fare = calculateFare();

    return {
      version: 2,

      origin: search.origin,
      destination: search.destination,

      tripType: search.tripType,

      departureDate:
        selectedOutbound.departureDate,

      returnDate:
        search.tripType === "Round trip"
          ? selectedReturn.departureDate
          : null,

      stops: search.stops,
      maximumBudget: search.maximumBudget,
      dateFlexibility: search.dateFlexibility,

      additionalPreferences:
        search.additionalPreferences,

      passengers: {
        adults: search.adults,
        children: search.children,
        infants: search.infants
      },

      cabin: search.cabin,

      outbound: selectedOutbound,
      return: selectedReturn,

      pricing: fare,

      priceSource: FARE_CONFIG.priceSource,

      savedAt: new Date().toISOString()
    };
  }

  // ==========================================
  // MOCK FLIGHT INVENTORY
  // ==========================================

  function makeOptions(origin, destination, date, seedText) {
    const seed = seedText
      .split("")
      .reduce((number, character) => number + character.charCodeAt(0), 0);

    return sampleOffers.map((offer, index) => {
      const shift = seed % 7;

      const depart = addMinutes(
        offer.depart,
        shift * 4
      );

      const duration =
        offer.duration + shift * 3 + (index % 2 ? 10 : 0);

      const flexibility = search?.dateFlexibility || "Exact dates";

      const offsets =
        flexibility === "1 day before or after"
          ? [0, -1, 1, 0, 0, 0, 0, 0]
          : (
              flexibility === "3 days before or after" ||
              flexibility === "Flexible - lowest fare matters most"
            )
              ? [0, -1, 1, -2, 2, -3, 3, 0]
              : [0, 0, 0, 0, 0, 0, 0, 0];

      const dateOffset = offsets[index] || 0;

      const price = Math.round(
        (
          offer.price +
          (seed % 13) * 175 +
          (index % 3) * 260 +
          (dateOffset < 0
            ? Math.abs(dateOffset) * -80
            : dateOffset * 40)
        ) / 10
      ) * 10;

      return {
        id: "leg-" + seed + "-" + index,

        airline: offer.airline,
        flight: offer.flight,

        depart,
        arrive: addMinutes(depart, duration),

        duration,
        stops: offer.stops,

        price,
        baggage: offer.baggage,

        origin,
        destination,

        departureDate: shiftDate(date, dateOffset)
      };
    });
  }

  // ==========================================
  // TRIP TYPE
  // ==========================================

  function updateTripType() {
    const roundTrip =
      form.querySelector('input[name="tripType"]:checked')
        .value === "Round trip";

    const returnDate = byId("returnDate");
    const returnWrap = byId("returnDateWrap");

    returnWrap.hidden = !roundTrip;
    returnDate.required = roundTrip;

    if (!roundTrip) {
      returnDate.value = "";
    }
  }

  // ==========================================
  // FLIGHT RESULTS
  // ==========================================

  function optionsMarkup(items, leg) {
    return items.map(option => `
      <article class="flight-result-card tq-leg-card">

        <div class="flight-result-top">
          <div>
            <div class="flight-airline-name">
              ${safe(option.airline)}
            </div>

            <div class="flight-flight-number">
              ${safe(option.flight)} ·
              ${option.stops === 0
                ? "Non-stop"
                : option.stops + " stop"}
            </div>
          </div>

          <div class="flight-demo-price">
            <strong>${money(option.price)}</strong>
            <small>demo fare / passenger</small>
          </div>
        </div>

        <div class="flight-route-line">
          <div>
            <div class="flight-time">
              ${safe(option.depart)}
            </div>

            <div class="flight-city">
              ${safe(option.origin.label)}
              (${safe(option.origin.code || "—")})
            </div>
          </div>

          <div class="flight-route-middle">
            <div>${durationText(option.duration)}</div>
            <div class="line"></div>
            <div>
              ${option.stops === 0
                ? "Non-stop"
                : option.stops + " stop"}
            </div>
          </div>

          <div class="text-end">
            <div class="flight-time">
              ${safe(option.arrive)}
            </div>

            <div class="flight-city">
              ${safe(option.destination.label)}
              (${safe(option.destination.code || "—")})
            </div>
          </div>
        </div>

        <div class="flight-result-meta">
          <span>
            <i class="far fa-calendar"></i>
            ${formatDate(option.departureDate)}
          </span>

          <span>
            <i class="fas fa-suitcase"></i>
            ${safe(option.baggage)}
          </span>

          <span>
            <i class="fas fa-chair"></i>
            ${safe(search.cabin)}
          </span>
        </div>

        <div class="flight-result-actions">
          <button
            type="button"
            class="flight-select-leg"
            data-select-leg="${leg}"
            data-offer-id="${option.id}"
          >
            Select this ${leg === "outbound" ? "departure" : "return"} flight
            <i class="fas fa-arrow-right ms-1"></i>
          </button>
        </div>

      </article>
    `).join("");
  }

  function filtersMarkup() {
    const preferred =
      search.stops === "Non-stop only"
        ? "nonstop"
        : search.stops === "1 stop or fewer"
          ? "one"
          : "any";

    return `
      <div class="flight-results-tools">

        <label for="resultStops">Stops</label>

        <select id="resultStops">
          <option value="any">Any stops</option>
          <option value="nonstop" ${preferred === "nonstop" ? "selected" : ""}>
            Non-stop
          </option>
          <option value="one" ${preferred === "one" ? "selected" : ""}>
            Up to 1 stop
          </option>
        </select>

        <label for="resultAirline">Airline</label>

        <select id="resultAirline">
          <option value="all">All airlines</option>
          <option>IndiGo</option>
          <option>Air India</option>
          <option>Akasa Air</option>
          <option>Air India Express</option>
        </select>

        <label for="resultSort">Sort by</label>

        <select id="resultSort">
          <option value="price">Lowest fare</option>
          <option value="duration">Shortest duration</option>
          <option value="departure">Departure time</option>
        </select>

        <span class="small text-muted">
          Budget: ${money(search.maximumBudget)} per passenger
        </span>

      </div>
    `;
  }

  function filteredOptions(items, leg) {
    const stops = byId("resultStops")?.value || "any";
    const airline = byId("resultAirline")?.value || "all";
    const sort = byId("resultSort")?.value || "price";

    const preference = search.stops || "Any";
    const max = Number(search.maximumBudget) || Infinity;

    const stopAllowed = option =>
      (
        preference === "Any" ||
        (preference === "Non-stop only" && option.stops === 0) ||
        (preference === "1 stop or fewer" && option.stops <= 1)
      ) &&
      (
        stops === "any" ||
        (stops === "nonstop" && option.stops === 0) ||
        (stops === "one" && option.stops <= 1)
      );

    const minimumOther =
      leg === "outbound" && search.tripType === "Round trip"
        ? Math.min(...returnOptions.map(option => option.price))
        : 0;

    const committed =
      leg === "return"
        ? (selectedOutbound?.price || 0)
        : 0;

    const filtered = items.filter(option => {
      const estimatedPerPassenger = Math.round(
        (committed + option.price + minimumOther) *
        (1 + FARE_CONFIG.taxRate)
      );

      return (
        stopAllowed(option) &&
        (airline === "all" || option.airline === airline) &&
        estimatedPerPassenger <= max
      );
    });

    filtered.sort((a, b) => {
      if (sort === "duration") return a.duration - b.duration;
      if (sort === "departure") return a.depart.localeCompare(b.depart);

      return a.price - b.price;
    });

    return filtered;
  }

  function heading(title, subtitle) {
    byId("resultRoute").textContent = title;
    byId("resultDates").textContent = subtitle;
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
      (isReturn
        ? "Choose your return flight"
        : "Choose your departure flight") +
      " · " + from.label + " → " + to.label,

      formatDate(isReturn ? search.returnDate : search.departureDate) +
      " · " + search.tripType +
      " · " + passengers() + " passenger(s)"
    );

    const stepper = `
      <div class="tq-booking-steps">

        <span class="${stage === "outbound" ? "is-active" : "is-done"}">
          1. Departure
        </span>

        ${search.tripType === "Round trip"
          ? `<span class="${stage === "return" ? "is-active" : ""}">
               2. Return
             </span>`
          : ""}

        <span>
          ${search.tripType === "Round trip" ? "3" : "2"}. Review & save
        </span>

      </div>
    `;

    const back = isReturn
      ? `
        <button
          type="button"
          class="btn btn-outline-secondary rounded-pill mb-3"
          data-back-outbound
        >
          <i class="fas fa-arrow-left me-1"></i>
          Change departure flight
        </button>
      `
      : "";

    byId("flightResultsList").innerHTML =
      stepper +
      back +
      filtersMarkup() +
      (
        items.length
          ? optionsMarkup(items, isReturn ? "return" : "outbound")
          : `<div class="flight-empty is-visible">
               No flights match these filters. Try another airline or stop preference.
             </div>`
      );

    byId("flightResultsEmpty").classList.remove("is-visible");
    byId("flightResultsList").hidden = false;

    ["resultStops", "resultAirline", "resultSort"].forEach(id => {
      byId(id)?.addEventListener("change", renderLegStage);
    });

    byId("flightResultsCount").textContent =
      items.length + " demo flight options";
  }

  // ==========================================
  // FARE BREAKDOWN
  // ==========================================

  function fareBreakdownMarkup(fare) {
    return `
      <div class="tq-price-breakdown">

        <div>
          <span>Outbound fare / passenger</span>
          <strong>${money(fare.outboundFarePerPassenger)}</strong>
        </div>

        ${fare.returnFarePerPassenger
          ? `
            <div>
              <span>Return fare / passenger</span>
              <strong>${money(fare.returnFarePerPassenger)}</strong>
            </div>
          `
          : ""}

        <div>
          <span>
            Base fare · ${fare.passengerCount} passenger(s)
          </span>
          <strong>${money(fare.baseFare)}</strong>
        </div>

        <div>
          <span>
            Estimated taxes & fees (${FARE_CONFIG.taxRate * 100}%)
          </span>
          <strong>${money(fare.taxAmount)}</strong>
        </div>

        <div>
          <span>Average estimated fare / passenger</span>
          <strong>${money(fare.averageFarePerPassenger)}</strong>
        </div>

        <div class="tq-grand-total">
          <span>Estimated total</span>
          <strong>${money(fare.totalFare)}</strong>
        </div>

        <small>
          Demonstration pricing only. The mock inventory applies the same
          fare to each traveller because separate child and infant fares
          are not available. Taxes are illustrative, not actual airline taxes.
          Final fare and availability require confirmation.
        </small>

      </div>
    `;
  }

  // ==========================================
  // ITINERARY SUMMARY
  // ==========================================

  function renderSummary() {
    const trip = itinerary();
    const fare = trip.pricing;

    const leg = (option, label) => `
      <div class="tq-summary-leg">

        <div class="tq-summary-leg-title">
          ${label} · ${formatDate(option.departureDate)}
        </div>

        <strong>
          ${safe(option.airline)} · ${safe(option.flight)}
        </strong>

        <div class="tq-summary-route">
          ${safe(option.origin.label)}
          (${safe(option.origin.code || "—")})
          <i class="fas fa-arrow-right"></i>
          ${safe(option.destination.label)}
          (${safe(option.destination.code || "—")})
        </div>

        <div class="tq-summary-times">
          ${safe(option.depart)} – ${safe(option.arrive)}
          · ${durationText(option.duration)}
        </div>

        <div class="tq-summary-fare">
          ${money(option.price)} per passenger
        </div>

      </div>
    `;

    const legs =
      leg(selectedOutbound, "Outbound") +
      (selectedReturn ? leg(selectedReturn, "Return") : "");

    const html = `
      <div class="tq-booking-steps">

        <span class="is-done">1. Departure</span>

        ${search.tripType === "Round trip"
          ? `<span class="is-done">2. Return</span>`
          : ""}

        <span class="is-active">Review & save</span>

      </div>

      <div class="tq-summary-card">

        <div class="tq-summary-heading">

          <div>
            <span class="flight-eyebrow text-primary">
              YOUR ITINERARY
            </span>

            <h3>
              ${safe(search.origin.label)}
              ↔
              ${safe(search.destination.label)}
            </h3>

            <p>
              ${search.tripType} ·
              ${fare.passengerCount} passenger(s) ·
              ${safe(search.cabin)}
            </p>
          </div>

          <button
            type="button"
            class="btn btn-link"
            data-edit-flights
          >
            Edit flights
          </button>

        </div>

        ${legs}

        ${fareBreakdownMarkup(fare)}

        <div class="tq-summary-actions">

          <button
            type="button"
            class="btn btn-primary"
            data-book-itinerary
          >
            <i class="fas fa-lock me-2"></i>
            Request booking
          </button>

          <button
            type="button"
            class="btn btn-outline-primary"
            data-save-wishlist
          >
            <i class="far fa-heart me-2"></i>
            ${wishlistId ? "Update saved trip" : "Save to wishlist"}
          </button>

          <button
            type="button"
            class="btn btn-outline-primary"
            data-share-itinerary="whatsapp"
          >
            <i class="fab fa-whatsapp me-2"></i>
            WhatsApp
          </button>

          <button
            type="button"
            class="btn btn-outline-primary"
            data-share-itinerary="email"
          >
            <i class="far fa-envelope me-2"></i>
            Email
          </button>

        </div>

        <p
          class="small text-muted mt-3 mb-0"
          data-itinerary-message
        >
          Estimated demo fare: ${money(fare.totalFare)}.
          Choose Request booking to submit your enquiry.
          This is not a confirmed ticket.
        </p>

      </div>
    `;

    byId("flightResultsList").innerHTML = html;

    byId("flightResultsCount").textContent =
      "Complete itinerary selected";

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
    if (stage === "summary") {
      renderSummary();
    } else {
      renderLegStage();
    }
  }

  function resetFilters() {
    ["resultStops", "resultAirline", "resultSort"].forEach(id => {
      const element = byId(id);

      if (element) {
        element.value =
          id === "resultStops"
            ? "any"
            : id === "resultAirline"
              ? "all"
              : "price";
      }
    });
  }

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  async function signedInUser() {
    const { data, error } = await supabase.auth.getUser();

    if (error) throw error;

    if (!data.user) {
      throw new Error(
        "Please sign in to save or request this itinerary."
      );
    }

    return data.user;
  }

  function messageNode() {
    return (
      byId("itinerary-message") ||
      document.querySelector("[data-itinerary-message]")
    );
  }

  // ==========================================
  // WISHLIST
  // ==========================================

  async function saveWishlist() {
    const node = messageNode();
    const button = byId("save-wishlist");
    const original = button?.innerHTML;

    if (button) {
      button.disabled = true;
      button.textContent = "Saving to wishlist…";
    }

    try {
      const user = await signedInUser();
      const trip = itinerary();

      const title =
        search.origin.label + " to " + search.destination.label;

      let error;

      if (wishlistId) {
        const result = await supabase
          .from("flight_wishlists")
          .update({
            title,
            itinerary: trip
          })
          .eq("id", wishlistId)
          .eq("user_id", user.id)
          .select("id")
          .single();

        error = result.error;
      } else {
        const result = await supabase
          .from("flight_wishlists")
          .insert({
            user_id: user.id,
            title,
            itinerary: trip
          });

        error = result.error;
      }

      if (error) throw error;

      if (node) {
        node.textContent = wishlistId
          ? "Your saved trip has been updated."
          : "Saved to your wishlist.";
      }

      if (button) {
        button.textContent = wishlistId
          ? "Saved trip updated"
          : "Saved to wishlist";

        button.disabled = true;
      }

    } catch (error) {
      if (node) {
        node.textContent = error.message;
      }

      if (button) {
        button.disabled = false;
        button.innerHTML = original;
      }
    }
  }

  // ==========================================
  // BOOKING SUBMISSION
  // ==========================================

  async function requestBooking(trip, user) {
    const outbound = trip.outbound;
    const returning = trip.return;
    const fare = trip.pricing;

    const payload = {
      user_id: user.id,

      origin: trip.origin.label,
      destination: trip.destination.label,

      origin_code: trip.origin.code || null,
      destination_code: trip.destination.code || null,

      trip_type: trip.tripType,

      departure_date: trip.departureDate,

      return_date:
        trip.tripType === "Round trip"
          ? trip.returnDate
          : null,

      adults: trip.passengers.adults,
      children: trip.passengers.children,
      infants: trip.passengers.infants,

      cabin_class: trip.cabin,

      airline: outbound.airline,
      flight_number: outbound.flight,

      departure_time: outbound.depart,
      arrival_time: outbound.arrive,

      return_airline: returning?.airline || null,
      return_flight_number: returning?.flight || null,

      return_departure_time: returning?.depart || null,
      return_arrival_time: returning?.arrive || null,

      base_fare: fare.baseFare,
      tax_amount: fare.taxAmount,
      demo_fare: fare.totalFare,

      additional_preferences:
        trip.additionalPreferences || null
    };

    const { data, error } = await supabase
      .from("flight_bookings")
      .insert(payload)
      .select("booking_reference")
      .single();

    if (error) throw error;

    return data.booking_reference;
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

      const trip = itinerary();

      const reference = await requestBooking(trip, user);

      if (node) {
        node.textContent =
          "Booking request " + reference +
          " has been submitted. Travel Qila must reconfirm " +
          "live availability and the final fare before ticketing.";
      }

      if (button) {
        button.textContent = "Request submitted";
      }

    } catch (error) {
      if (node) {
        node.textContent = error.message;
      }

      if (button) {
        button.disabled = false;
        button.innerHTML =
          '<i class="fas fa-lock me-2"></i>Request booking';
      }
    }
  }

  // ==========================================
  // SHARE ITINERARY
  // ==========================================

  function shareItinerary(channel) {
    const trip = itinerary();
    const fare = trip.pricing;

    const outbound = trip.outbound;
    const returning = trip.return;

    const lines = [
      "Hello Travel Qila, I would like to request this flight itinerary.",

      "Trip: " + trip.tripType,

      "Route: " +
        trip.origin.label +
        " (" + (trip.origin.code || "") + ") to " +
        trip.destination.label +
        " (" + (trip.destination.code || "") + ")",

      "Departure: " + formatDate(trip.departureDate),

      trip.tripType === "Round trip"
        ? "Return: " + formatDate(trip.returnDate)
        : "",

      "Passengers: " +
        trip.passengers.adults + " adult(s), " +
        trip.passengers.children + " child(ren), " +
        trip.passengers.infants + " infant(s)",

      "Cabin: " + trip.cabin,

      "Outbound: " +
        outbound.airline + " " + outbound.flight +
        " | " + outbound.depart + "–" + outbound.arrive +
        " | " + formatDate(outbound.departureDate) +
        " | " + money(outbound.price) + " per passenger",

      returning
        ? "Return: " +
          returning.airline + " " + returning.flight +
          " | " + returning.depart + "–" + returning.arrive +
          " | " + formatDate(returning.departureDate) +
          " | " + money(returning.price) + " per passenger"
        : "",

      "Base fare for all passengers: " + money(fare.baseFare),

      "Illustrative tax estimate: " + money(fare.taxAmount),

      "Estimated demo total: " + money(fare.totalFare),

      trip.additionalPreferences
        ? "Additional preferences: " + trip.additionalPreferences
        : "",

      "This is an enquiry, not a confirmed ticket. " +
        "Please reconfirm live availability and final fare."
    ].filter(Boolean);

    const message = lines.join("\n");

    if (channel === "whatsapp") {
      window.open(
        "https://wa.me/919871101345?text=" +
          encodeURIComponent(message),
        "_blank",
        "noopener,noreferrer"
      );
    } else if (channel === "email") {
      window.location.href =
        "mailto:info@travelqila.com?subject=" +
        encodeURIComponent("Travel Qila - Flight booking enquiry") +
        "&body=" +
        encodeURIComponent(message);
    }
  }

  // ==========================================
  // EVENT HANDLERS
  // ==========================================

  results.addEventListener("click", async event => {
    const target = event.target.closest("button");

    if (!target) return;

    if (target.hasAttribute("data-select-leg")) {
      const id = target.dataset.offerId;
      const leg = target.dataset.selectLeg;

      const options =
        leg === "return"
          ? returnOptions
          : outboundOptions;

      const selected = options.find(option => option.id === id);

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

      results.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } else if (target.hasAttribute("data-back-outbound")) {
      stage = "outbound";
      selectedReturn = null;
      resetFilters();
      showStage();

    } else if (target.hasAttribute("data-edit-flights")) {
      stage =
        selectedOutbound && search.tripType === "Round trip"
          ? "return"
          : "outbound";

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

  // ==========================================
  // SEARCH FORM VALIDATION
  // ==========================================

  form.querySelectorAll('input[name="tripType"]').forEach(input => {
    input.addEventListener("change", updateTripType);
  });

  byId("departDate").addEventListener("change", () => {
    byId("returnDate").min = byId("departDate").value;
  });

  byId("swapCities").addEventListener("click", () => {
    const origin = byId("origin");
    const destination = byId("destination");

    const value = origin.value;

    origin.value = destination.value;
    destination.value = value;
  });

  function validateSearch() {
    const origin = parseAirport(byId("origin").value);
    const destination = parseAirport(byId("destination").value);

    if (
      !origin.city ||
      !destination.city
    ) {
      throw new Error("Please select both departure and arrival cities.");
    }

    if (
      origin.city.toLowerCase() === destination.city.toLowerCase() ||
      (origin.code && origin.code === destination.code)
    ) {
      throw new Error("Choose a different arrival airport.");
    }

    const departureDate = byId("departDate").value;
    const returnDate = byId("returnDate").value;

    if (departureDate < localDateString()) {
      throw new Error("Departure date cannot be in the past.");
    }

    const tripType =
      form.querySelector('input[name="tripType"]:checked').value;

    if (
      tripType === "Round trip" &&
      (!returnDate || returnDate < departureDate)
    ) {
      throw new Error("Return date must be on or after departure date.");
    }

    const adults = Number(byId("adults").value);
    const children = Number(byId("children").value);
    const infants = Number(byId("infants").value);

    if (
      !Number.isInteger(adults) ||
      !Number.isInteger(children) ||
      !Number.isInteger(infants) ||
      adults < 1 ||
      children < 0 ||
      infants < 0
    ) {
      throw new Error("Please enter valid passenger counts.");
    }

    if (infants > adults) {
      throw new Error("Infants cannot exceed the number of adults.");
    }

    return {
      origin,
      destination,
      departureDate,
      returnDate: tripType === "Round trip" ? returnDate : null,
      tripType,
      adults,
      children,
      infants
    };
  }

  form.addEventListener("submit", event => {
    event.preventDefault();

    updateTripType();

    if (!form.reportValidity()) return;

    try {
      const validated = validateSearch();

      search = {
        ...validated,

        cabin: byId("cabin").value,
        stops: byId("stops").value,

        maximumBudget: Number(byId("maxPrice").value),

        dateFlexibility: byId("flexibility").value,

        additionalPreferences: byId("notes").value.trim()
      };

      selectedOutbound = null;
      selectedReturn = null;

      stage = "outbound";

      outboundOptions = makeOptions(
        search.origin,
        search.destination,
        search.departureDate,
        search.origin.code + search.destination.code
      );

      returnOptions =
        search.tripType === "Round trip"
          ? makeOptions(
              search.destination,
              search.origin,
              search.returnDate,
              search.destination.code + search.origin.code
            )
          : [];

      byId("flightResultsCount").textContent =
        "Choose your departure flight";

      results.hidden = false;

      showStage();

      results.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

    } catch (error) {
      alert(error.message);
    }
  });

  // ==========================================
  // URL PARAMETERS / WISHLIST SUPPORT
  // ==========================================

  const params = new URLSearchParams(window.location.search);

  wishlistId = params.get("wishlistId") || null;

  if (params.has("origin") && params.has("destination")) {
    byId("origin").value = params.get("origin") || "";
    byId("destination").value = params.get("destination") || "";

    const trip =
      params.get("tripType") === "Round trip"
        ? "Round trip"
        : "One way";

    const radio = form.querySelector(
      'input[name="tripType"][value="' + trip + '"]'
    );

    if (radio) radio.checked = true;

    byId("departDate").value =
      params.get("departureDate") || "";

    byId("returnDate").value =
      params.get("returnDate") || "";

    ["adults", "children", "infants"].forEach(id => {
      const value = params.get(id);

      if (value !== null && byId(id)) {
        byId(id).value = value;
      }
    });

    if (params.get("cabin")) {
      byId("cabin").value = params.get("cabin");
    }
  }

  // ==========================================
  // INITIALIZATION
  // ==========================================

  const today = localDateString();

  byId("departDate").min = today;
  byId("returnDate").min = today;

  const budget = byId("maxPrice");
  const budgetOutput = byId("priceOutput");

  const syncBudget = () => {
    if (budgetOutput && budget) {
      budgetOutput.textContent = money(budget.value);
    }
  };

  if (budget) {
    budget.addEventListener("input", syncBudget);
  }

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

    if (
      validOrigin &&
      validDestination &&
      validDeparture &&
      validReturn
    ) {
      form.requestSubmit();
    }
  }

})();
