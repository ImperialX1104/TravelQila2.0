
import { supabase } from "./auth-client.js";

(() => {
  "use strict";

  const form = document.getElementById("flightSearchForm");
  const results = document.getElementById("flightResults");

  if (!form || !results) return;

  // =========================================================
  // 01. CONFIGURATION
  // Uses the existing Travel Qila stylesheet.
  // No CSS is injected or overridden by this script.
  // =========================================================

  const FARE_CONFIG = {
    adultMultiplier: 1,
    childMultiplier: 0.75,
    infantMultiplier: 0.25,
    taxRate: 0.05,
    currency: "INR"
  };

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
    { airline: "IndiGo", flight: "6E 9912", depart: "21:15", duration: 215, stops: 1, price: 6250, baggage: "15 kg check-in" },
    { airline: "Air India", flight: "AI 6721", depart: "05:50", duration: 420, stops: 2, price: 9150, baggage: "25 kg check-in" },
    { airline: "IndiGo", flight: "6E 7724", depart: "14:05", duration: 390, stops: 2, price: 8750, baggage: "15 kg check-in" }
  ];

  const byId = id => document.getElementById(id);

  const safe = value =>
    String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[c]));

  // =========================================================
  // 02. CURRENCY FORMATTER
  // =========================================================

  const money = value => {
    const amount = Number(value || 0);

    if (!Number.isFinite(amount)) return "₹0";

    const currencyAPI = window.TravelQilaCurrency;
    const selectedCurrency =
      currencyAPI?.getCurrency?.() || "INR";
    const rates = currencyAPI?.getRates?.();

    if (!currencyAPI || !rates) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
      }).format(amount);
    }

    const converted = currencyAPI.convert(
      amount,
      "INR",
      selectedCurrency
    );

    if (!Number.isFinite(converted)) {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
      }).format(amount);
    }

    const locales = {
      INR: "en-IN",
      USD: "en-US",
      EUR: "de-DE",
      GBP: "en-GB"
    };

    try {
      return new Intl.NumberFormat(
        locales[selectedCurrency] || "en-IN",
        {
          style: "currency",
          currency: selectedCurrency,
          maximumFractionDigits: 2
        }
      ).format(converted);
    } catch {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2
      }).format(amount);
    }
  };

  // =========================================================
  // 03. DATE AND TIME HELPERS
  // =========================================================

  const durationText = minutes => {
    const value = Math.max(0, Math.floor(Number(minutes) || 0));
    const hours = Math.floor(value / 60);
    const mins = value % 60;

    return hours
      ? hours + "h " + (mins ? mins + "m" : "")
      : mins + "m";
  };

  const formatDate = value =>
    value
      ? new Date(value + "T12:00:00").toLocaleDateString(
          "en-IN",
          { day: "numeric", month: "short", year: "numeric" }
        )
      : "";

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

  function addDateTime(date, time, minutes) {
    const [year, month, day] = date.split("-").map(Number);
    const [hours, mins] = time.split(":").map(Number);
    const value = new Date(year, month - 1, day, hours, mins + minutes);

    return {
      date: value.getFullYear() + "-" +
        String(value.getMonth() + 1).padStart(2, "0") + "-" +
        String(value.getDate()).padStart(2, "0"),
      time: String(value.getHours()).padStart(2, "0") + ":" +
        String(value.getMinutes()).padStart(2, "0")
    };
  }

  // =========================================================
  // 04. CONNECTION ENGINE
  // =========================================================

  const CONNECTION_HUBS = [
    { code: "BOM", city: "Mumbai" },
    { code: "BLR", city: "Bengaluru" },
    { code: "HYD", city: "Hyderabad" },
    { code: "MAA", city: "Chennai" },
    { code: "CCU", city: "Kolkata" },
    { code: "DOH", city: "Doha" },
    { code: "DXB", city: "Dubai" },
    { code: "AUH", city: "Abu Dhabi" },
    { code: "SIN", city: "Singapore" },
    { code: "KUL", city: "Kuala Lumpur" }
  ];

  function buildConnectionDetails(
    origin,
    destination,
    date,
    depart,
    duration,
    stops,
    seed,
    index
  ) {
    if (!stops) {
      const arrival = addDateTime(date, depart, duration);

      return {
        segments: [{
          from: origin,
          to: destination,
          depart,
          arrive: arrival.time,
          departureDate: date,
          arrivalDate: arrival.date,
          duration,
          flight: null
        }],
        layovers: [],
        arrive: arrival.time,
        arrivalDate: arrival.date
      };
    }

    const candidates = CONNECTION_HUBS.filter(hub =>
      hub.code !== origin.code &&
      hub.code !== destination.code
    );

    const hubs = [];
    let cursor = (seed + index * 3) % candidates.length;

    while (hubs.length < stops && hubs.length < candidates.length) {
      const hub = candidates[cursor % candidates.length];

      if (!hubs.some(item => item.code === hub.code)) {
        hubs.push(hub);
      }

      cursor += 3;
    }

    for (const hub of candidates) {
      if (hubs.length >= stops) break;

      if (!hubs.some(item => item.code === hub.code)) {
        hubs.push(hub);
      }
    }

    const points = [
      origin,
      ...hubs.map(hub => ({
        code: hub.code,
        city: hub.city,
        label: hub.city
      })),
      destination
    ];

    const layoverDurations = Array.from(
      { length: stops },
      (_, i) => 85 + ((seed + index * 17 + i * 29) % 76)
    );

    const totalLayover = layoverDurations.reduce(
      (sum, value) => sum + value,
      0
    );

    const totalFlying = Math.max(
      stops + 1,
      duration - totalLayover
    );

    const baseFlight = Math.floor(
      totalFlying / (stops + 1)
    );

    let flyingRemainder =
      totalFlying - baseFlight * (stops + 1);

    let clockDate = date;
    let clockTime = depart;

    const segments = [];
    const layovers = [];

    for (let i = 0; i <= stops; i++) {
      const segmentDuration =
        baseFlight + (flyingRemainder-- > 0 ? 1 : 0);

      const arrival = addDateTime(
        clockDate,
        clockTime,
        segmentDuration
      );

      segments.push({
        from: points[i],
        to: points[i + 1],
        depart: clockTime,
        arrive: arrival.time,
        departureDate: clockDate,
        arrivalDate: arrival.date,
        duration: segmentDuration,
        flight: null
      });

      clockDate = arrival.date;
      clockTime = arrival.time;

      if (i < stops) {
        const nextDeparture = addDateTime(
          clockDate,
          clockTime,
          layoverDurations[i]
        );

        layovers.push({
          airport: points[i + 1],
          arrival: clockTime,
          departure: nextDeparture.time,
          arrivalDate: clockDate,
          departureDate: nextDeparture.date,
          duration: layoverDurations[i]
        });

        clockDate = nextDeparture.date;
        clockTime = nextDeparture.time;
      }
    }

    segments.forEach((segment, i) => {
      segment.flight = " " + String(i + 1);
    });

    return {
      segments,
      layovers,
      arrive: segments[segments.length - 1].arrive,
      arrivalDate: segments[segments.length - 1].arrivalDate
    };
  }

  function airportName(airport) {
    return airport?.label ||
      airport?.city ||
      airport?.code ||
      "Unknown airport";
  }

  // =========================================================
  // 05. CONNECTION DETAILS MARKUP
  // Uses the existing white flight-card styling.
  // =========================================================

  function connectionMarkup(option) {
    if (
      !option?.stops ||
      !Array.isArray(option.layovers) ||
      !option.layovers.length
    ) {
      return "";
    }

    const segments = option.segments || [];

    const totalLayover = option.layovers.reduce(
      (sum, item) => sum + Number(item.duration || 0),
      0
    );

    const totalFlying = segments.reduce(
      (sum, item) => sum + Number(item.duration || 0),
      0
    );

    const overnight = option.layovers.some(
      item => item.arrivalDate !== item.departureDate
    );

    const segmentRows = segments.map((segment, index) => {
      const segmentMarkup =
        '<div class="flight-result-meta">' +
          '<span><strong>Flight leg ' +
            String(index + 1).padStart(2, "0") +
          '</strong></span>' +
          '<span>' +
            safe(airportName(segment.from)) +
            ' (' + safe(segment.from.code || "—") + ')' +
            ' → ' +
            safe(airportName(segment.to)) +
            ' (' + safe(segment.to.code || "—") + ')' +
          '</span>' +
          '<span>' +
            safe(segment.flight || option.flight) +
          '</span>' +
          '<span>' +
            safe(segment.depart) + ' – ' +
            safe(segment.arrive) +
          '</span>' +
          '<span>' +
            durationText(segment.duration) +
          '</span>' +
          '<span>' +
            formatDate(segment.departureDate) +
          '</span>' +
        '</div>';

      const layover = option.layovers[index];

      const layoverMarkup = layover
        ? '<div class="flight-result-meta">' +
            '<span><strong>Connection · ' +
              safe(airportName(layover.airport)) +
              ' (' + safe(layover.airport.code || "—") + ')' +
            '</strong></span>' +
            '<span>Arrive ' +
              safe(layover.arrival) +
            '</span>' +
            '<span>Depart ' +
              safe(layover.departure) +
            '</span>' +
            '<span>' +
              durationText(layover.duration) +
            '</span>' +
            (layover.arrivalDate !== layover.departureDate
              ? '<span>Overnight connection</span>'
              : '') +
          '</div>'
        : "";

      return segmentMarkup + layoverMarkup;
    }).join("");

    return (
      '<details class="flight-result-card flight-connection-details">' +
        '<summary>' +
          '<strong>View flight connections</strong>' +
          ' · ' +
          option.stops + ' stop' +
          (option.stops > 1 ? "s" : "") +
          ' · ' + durationText(totalLayover) +
          ' total layover' +
        '</summary>' +

        '<div class="flight-result-meta">' +
          '<span>' + segments.length + ' flight legs</span>' +
          '<span>' + durationText(totalFlying) + ' flying time</span>' +
          '<span>' + durationText(totalLayover) + ' total layover</span>' +
          (overnight ? '<span>Overnight connection</span>' : '') +
        '</div>' +

        segmentRows +
      '</details>'
    );
  }

  // =========================================================
  // 06. AIRPORT AND SEARCH STATE
  // =========================================================

  function parseAirport(value) {
    const text = String(value).trim();
    const match = text.match(/\(([A-Za-z]{3})\)\s*$/);
    const code = match ? match[1].toUpperCase() : "";
    const city = text.replace(/\s*\([A-Za-z]{3}\)\s*$/, "");

    return {
      city: city || text,
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

  let resultFilters = {
    stops: "any",
    airline: "all",
    sort: "price"
  };

  function passengers() {
    if (!search) return 0;

    return search.adults +
      search.children +
      search.infants;
  }

  // =========================================================
  // 07. PASSENGER VALIDATION
  // =========================================================

  function syncInfantLimit() {
    const infantsInput = byId("infants");

    if (!infantsInput) return;

    if (infantsInput.tagName === "SELECT") {
      Array.from(infantsInput.options).forEach(option => {
        option.disabled = false;
      });
    }

    infantsInput.setCustomValidity("");
  }

  function validatePassengerCounts() {
    const adultsInput = byId("adults");
    const childrenInput = byId("children");
    const infantsInput = byId("infants");

    if (!adultsInput || !childrenInput || !infantsInput) {
      return null;
    }

    const adults = Number(adultsInput.value);
    const children = Number(childrenInput.value);
    const infants = Number(infantsInput.value);

    [adultsInput, childrenInput, infantsInput].forEach(input => {
      input.setCustomValidity("");
    });

    if (
      !Number.isInteger(adults) ||
      !Number.isInteger(children) ||
      !Number.isInteger(infants) ||
      adults < 0 ||
      children < 0 ||
      infants < 0
    ) {
      adultsInput.setCustomValidity(
        "Please enter valid passenger counts."
      );

      adultsInput.reportValidity();
      adultsInput.focus();

      return null;
    }

    if (infants > adults) {
      infantsInput.setCustomValidity(
        "The number of infants cannot exceed the number of adults."
      );

      infantsInput.reportValidity();
      infantsInput.focus();

      return null;
    }

    if (infants > 0 && adults === 0) {
      infantsInput.setCustomValidity(
        "At least one adult is required when travelling with an infant."
      );

      infantsInput.reportValidity();
      infantsInput.focus();

      return null;
    }

    if (adults + children + infants < 1) {
      adultsInput.setCustomValidity(
        "At least one passenger is required."
      );

      adultsInput.reportValidity();
      adultsInput.focus();

      return null;
    }

    return { adults, children, infants };
  }

  // =========================================================
  // 08. FLIGHT DATA GENERATOR
  // =========================================================

  function makeOptions(origin, destination, date, seedText) {
    const seed = seedText.split("").reduce(
      (n, c) => n + c.charCodeAt(0),
      0
    );

    return sampleOffers.map((offer, index) => {
      const shift = seed % 7;
      const depart = addMinutes(offer.depart, shift * 4);

      const duration =
        offer.duration +
        shift * 3 +
        (index % 2 ? 10 : 0);

      const flexibility = search?.dateFlexibility || "Exact dates";

      const offsets =
        flexibility === "1 day before or after"
          ? [0, -1, 1, 0, 0, 0, 0, 0]
          : flexibility === "3 days before or after" ||
            flexibility === "Flexible - lowest fare matters most"
            ? [0, -1, 1, -2, 2, -3, 3, 0]
            : [0, 0, 0, 0, 0, 0, 0, 0];

      const dateOffset = offsets[index] || 0;

      const price = Math.round((
        offer.price +
        (seed % 13) * 175 +
        (index % 3) * 260 +
        (dateOffset < 0
          ? Math.abs(dateOffset) * -80
          : dateOffset * 40)
      ) / 10) * 10;

      const departureDate = shiftDate(date, dateOffset);

      const connections = buildConnectionDetails(
        origin,
        destination,
        departureDate,
        depart,
        duration,
        offer.stops,
        seed,
        index
      );

      const segments = connections.segments.map(
        (segment, segmentIndex) => ({
          ...segment,
          flight: offer.flight +
            (segmentIndex ? "-" + (segmentIndex + 1) : "")
        })
      );

      return {
        id: "leg-" + seed + "-" + index,
        airline: offer.airline,
        flight: offer.flight,
        depart,
        arrive: connections.arrive,
        arrivalDate: connections.arrivalDate,
        duration,
        stops: offer.stops,
        segments,
        layovers: connections.layovers,
        price,
        baggage: offer.baggage,
        origin,
        destination,
        departureDate
      };
    });
  }

  // =========================================================
  // 09. PASSENGER FARE ENGINE
  // =========================================================

  function pricing(
    outbound = selectedOutbound,
    returning = selectedReturn
  ) {
    const outboundFare = outbound?.price || 0;
    const returnFare = returning?.price || 0;

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
      const outboundPerPerson = Math.round(
        outboundFare * category.multiplier
      );

      const returnPerPerson = Math.round(
        returnFare * category.multiplier
      );

      const outboundTotal =
        outboundPerPerson * category.count;

      const returnTotal =
        returnPerPerson * category.count;

      return {
        key: category.key,
        label: category.label,
        count: category.count,
        multiplier: category.multiplier,
        outboundPerPerson,
        returnPerPerson,
        outboundTotal,
        returnTotal,
        subtotal: outboundTotal + returnTotal
      };
    });

    const baseFare = breakdown.reduce(
      (sum, item) => sum + item.subtotal,
      0
    );

    const taxAmount = Math.round(
      baseFare * FARE_CONFIG.taxRate
    );

    const totalFare = baseFare + taxAmount;
    const passengerCount = passengers();

    return {
      baseFare,
      taxAmount,
      totalFare,
      taxRate: FARE_CONFIG.taxRate,
      currency: FARE_CONFIG.currency,
      categories: breakdown,
      outboundAdultFare: outboundFare,
      returnAdultFare: returnFare,
      averageFarePerPassenger: passengerCount
        ? totalFare / passengerCount
        : 0,
      pricingModel: "illustrative_category_based"
    };
  }

  // =========================================================
  // 10. ITINERARY OBJECT
  // =========================================================

  function itinerary() {
    const p = pricing();

    return {
      version: 2,
      origin: search.origin,
      destination: search.destination,
      tripType: search.tripType,
      departureDate:
        selectedOutbound?.departureDate || search.departureDate,
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

  // =========================================================
  // 11. FLIGHT CARD GENERATOR
  // Matches the classes in your existing stylesheet.
  // =========================================================

  function airlineInitials(name) {
    return String(name || "")
      .split(/\s+/)
      .map(word => word[0])
      .join("")
      .slice(0, 3)
      .toUpperCase();
  }

  function optionsMarkup(items, leg) {
    return items.map((o, index) => {
      const stopText = o.stops === 0
        ? "Non-stop"
        : o.stops + (o.stops === 1 ? " stop" : " stops");

      const dateText = formatDate(o.departureDate);

      return (
        '<article class="flight-result-card">' +

          '<div class="flight-result-top">' +

            '<div class="flight-airline">' +
              '<div class="flight-airline-mark">' +
                safe(airlineInitials(o.airline)) +
              '</div>' +

              '<div>' +
                '<div class="flight-airline-name">' +
                  safe(o.airline) +
                '</div>' +

                '<div class="flight-flight-number">' +
                  safe(o.flight) +
                  ' · Option ' +
                  String(index + 1).padStart(2, "0") +
                '</div>' +
              '</div>' +
            '</div>' +

            '<div class="flight-demo-price">' +
              '<strong>' + money(o.price) + '</strong>' +
              '<small>Adult demo fare · per passenger</small>' +
            '</div>' +

          '</div>' +

          '<div class="flight-route-line">' +

            '<div>' +
              '<div class="flight-time">' +
                safe(o.depart) +
              '</div>' +
              '<div class="flight-city">' +
                safe(o.origin.label) +
                ' (' + safe(o.origin.code || "—") + ')' +
              '</div>' +
            '</div>' +

            '<div class="flight-route-middle">' +
              '<span>' + durationText(o.duration) + '</span>' +
              '<div class="line"></div>' +
              '<span>' + safe(stopText) + '</span>' +
            '</div>' +

            '<div style="text-align:right">' +
              '<div class="flight-time">' +
                safe(o.arrive) +
              '</div>' +
              '<div class="flight-city">' +
                safe(o.destination.label) +
                ' (' + safe(o.destination.code || "—") + ')' +
              '</div>' +
            '</div>' +

          '</div>' +

          '<div class="flight-result-meta">' +
            '<span>✈ ' + safe(stopText) + '</span>' +
            '<span>◷ ' + durationText(o.duration) + '</span>' +
            '<span>▣ ' + safe(dateText) + '</span>' +
            '<span> Baggage · ' + safe(o.baggage) + '</span>' +
            '<span>' + safe(search.cabin) + '</span>' +
            '<span>Demo inventory</span>' +
          '</div>' +

          connectionMarkup(o) +

          '<div class="flight-result-actions">' +
            '<button type="button" class="flight-select-leg" ' +
              'data-select-leg="' + leg + '" ' +
              'data-offer-id="' + safe(o.id) + '">' +
              'Select ' +
              (leg === "outbound" ? "departure" : "return") +
              ' flight →' +
            '</button>' +
          '</div>' +

        '</article>'
      );
    }).join("");
  }

  // =========================================================
  // 12. FILTER CONTROLS
  // =========================================================

  function filtersMarkup() {
    return '<div class="flight-results-tools">' +

      '<label for="resultStops">Stops</label>' +
      '<select id="resultStops">' +
        '<option value="any" ' +
          (resultFilters.stops === "any" ? "selected" : "") +
        '>Any stops</option>' +
        '<option value="nonstop" ' +
          (resultFilters.stops === "nonstop" ? "selected" : "") +
        '>Non-stop</option>' +
        '<option value="one" ' +
          (resultFilters.stops === "one" ? "selected" : "") +
        '>Up to 1 stop</option>' +
        '<option value="two" ' +
          (resultFilters.stops === "two" ? "selected" : "") +
        '>Up to 2 stops</option>' +
      '</select>' +

      '<label for="resultAirline">Airline</label>' +
      '<select id="resultAirline">' +
        '<option value="all" ' +
          (resultFilters.airline === "all" ? "selected" : "") +
        '>All airlines</option>' +
        '<option value="IndiGo" ' +
          (resultFilters.airline === "IndiGo" ? "selected" : "") +
        '>IndiGo</option>' +
        '<option value="Air India" ' +
          (resultFilters.airline === "Air India" ? "selected" : "") +
        '>Air India</option>' +
        '<option value="Akasa Air" ' +
          (resultFilters.airline === "Akasa Air" ? "selected" : "") +
        '>Akasa Air</option>' +
        '<option value="Air India Express" ' +
          (resultFilters.airline === "Air India Express" ? "selected" : "") +
        '>Air India Express</option>' +
      '</select>' +

      '<label for="resultSort">Sort by</label>' +
      '<select id="resultSort">' +
        '<option value="price" ' +
          (resultFilters.sort === "price" ? "selected" : "") +
        '>Lowest fare</option>' +
        '<option value="duration" ' +
          (resultFilters.sort === "duration" ? "selected" : "") +
        '>Shortest duration</option>' +
        '<option value="departure" ' +
          (resultFilters.sort === "departure" ? "selected" : "") +
        '>Departure time</option>' +
      '</select>' +

      '<span class="flight-results-count">' +
        'Budget: ' + money(search.maximumBudget) +
        ' average per passenger' +
      '</span>' +

    '</div>';
  }

  // =========================================================
  // 13. FILTER AND SORT ENGINE
  // =========================================================

  function estimatedAverageFare(outbound, returning) {
    const p = pricing(outbound, returning);
    return p.averageFarePerPassenger;
  }

  function filteredOptions(items, leg) {
    const stops = resultFilters.stops;
    const airline = resultFilters.airline;
    const sort = resultFilters.sort;

    const preference = search.stops || "Any";
    const max = Number(search.maximumBudget) || Infinity;

    const stopAllowed = o =>
      (preference === "Any" ||
        (preference === "Non-stop only" && o.stops === 0) ||
        (preference === "1 stop or fewer" && o.stops <= 1)) &&
      (stops === "any" ||
        (stops === "nonstop" && o.stops === 0) ||
        (stops === "one" && o.stops <= 1) ||
        (stops === "two" && o.stops <= 2));

    const out = items.filter(o => {
      if (!stopAllowed(o)) return false;

      if (airline !== "all" && o.airline !== airline) {
        return false;
      }

      let proposedAverage;

      if (leg === "return") {
        proposedAverage = estimatedAverageFare(
          selectedOutbound,
          o
        );
      } else if (search.tripType === "Round trip") {
        const cheapestReturn = returnOptions
          .filter(r => stopAllowed(r))
          .filter(r => airline === "all" || r.airline === airline)
          .sort((a, b) => a.price - b.price)[0];

        if (!cheapestReturn) return false;

        proposedAverage = estimatedAverageFare(
          o,
          cheapestReturn
        );
      } else {
        proposedAverage = estimatedAverageFare(o, null);
      }

      return proposedAverage <= max;
    });

    if (sort === "duration") {
      out.sort((a, b) =>
        (a.duration - b.duration) ||
        (a.price - b.price) ||
        a.depart.localeCompare(b.depart)
      );
    } else if (sort === "departure") {
      out.sort((a, b) =>
        a.depart.localeCompare(b.depart) ||
        (a.duration - b.duration)
      );
    } else {
      out.sort((a, b) =>
        (a.price - b.price) ||
        (a.duration - b.duration)
      );
    }

    return out;
  }

  // =========================================================
  // 14. RESULTS HEADER AND BOOKING STEPPER
  // =========================================================

  function heading(title, sub) {
    const route = byId("resultRoute");
    const dates = byId("resultDates");

    if (route) route.textContent = title;
    if (dates) dates.textContent = sub;
  }

  function resetFilters() {
    resultFilters = {
      stops: "any",
      airline: "all",
      sort: "price"
    };
  }

  function heroMarkup(title, subtitle, stats) {
    return (
      '<div class="flight-results-heading">' +
        '<div>' +
          '<span class="flight-demo-chip">Travel Qila · Flight results</span>' +
          '<h2>' + safe(title) + '</h2>' +
          '<p>' + safe(subtitle) + '</p>' +
        '</div>' +
        '<div class="flight-results-count">' +
          stats.map(item =>
            '<span>' +
              '<strong>' + safe(item.value) + '</strong> ' +
              safe(item.label) +
            '</span>'
          ).join(' · ') +
        '</div>' +
      '</div>'
    );
  }

  // =========================================================
  // 15. RENDER FLIGHT RESULTS
  // =========================================================

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

      formatDate(
        isReturn ? search.returnDate : search.departureDate
      ) +
      " · " + search.tripType +
      " · " + passengers() + " passenger(s)"
    );

    const stepper =
      '<div class="tq-booking-steps">' +
        '<span class="' +
          (stage === "outbound" ? "is-active" : "is-done") +
        '">1. Departure</span>' +

        (search.tripType === "Round trip"
          ? '<span class="' +
              (stage === "return" ? "is-active" : "") +
            '">2. Return</span>'
          : "") +

        '<span>' +
          (search.tripType === "Round trip" ? "3" : "2") +
          '. Review & save</span>' +
      '</div>';

    const back = isReturn
      ? '<button type="button" class="btn btn-outline-primary mb-3" data-back-outbound>' +
          '← Change departure flight</button>'
      : "";

    const hero = heroMarkup(
      isReturn ? "Choose your return flight" : "Choose your departure flight",
      from.label + " → " + to.label +
        " · " + formatDate(
          isReturn ? search.returnDate : search.departureDate
        ),
      [
        {
          value: items.length,
          label: "available options"
        },
        {
          value: passengers(),
          label: "passengers"
        },
        {
          value: search.stops,
          label: "stop preference"
        }
      ]
    );

    const demoNotice =
      '<div class="flight-demo-banner">' +
        '<span aria-hidden="true">ⓘ</span>' +
        '<div>' +
          '<strong>Demo inventory:</strong> These are illustrative ' +
          'flight options, not live airline inventory. Prices, ' +
          'schedules and connections must be verified before booking.' +
        '</div>' +
      '</div>';

    const list = byId("flightResultsList");
    const empty = byId("flightResultsEmpty");
    const count = byId("flightResultsCount");

    if (!list || !empty || !count) return;

    list.innerHTML =
      hero +
      stepper +
      back +
      filtersMarkup() +
      demoNotice +
      (items.length
        ? optionsMarkup(
            items,
            isReturn ? "return" : "outbound"
          )
        : '<div class="flight-empty is-visible">' +
            '<strong>No matching flights found</strong>' +
            '<p>No flights match these filters. Adjust your search criteria.</p>' +
          '</div>');

    empty.classList.remove("is-visible");
    list.hidden = false;

    ["resultStops", "resultAirline", "resultSort"].forEach(id => {
      byId(id)?.addEventListener("change", () => {
        resultFilters = {
          stops: byId("resultStops")?.value || "any",
          airline: byId("resultAirline")?.value || "all",
          sort: byId("resultSort")?.value || "price"
        };

        renderLegStage();
      });
    });

    count.textContent = items.length + " demo flight options";
  }

  // =========================================================
  // 16. FARE BREAKDOWN
  // =========================================================

  function fareBreakdownMarkup(p) {
    const rows = p.categories
      .filter(item => item.count > 0)
      .map(item => {
        const tripFarePerPerson =
          item.outboundPerPerson + item.returnPerPerson;

        return '<div class="tq-fare-category">' +
          '<div>' +
            '<strong>' +
              item.label + ' (' + item.count + ')' +
            '</strong>' +
            '<small>' +
              item.count + ' × ' +
              money(tripFarePerPerson) +
              ' per passenger' +
              (search.tripType === "Round trip"
                ? ' · outbound + return'
                : ' · one way') +
            '</small>' +
          '</div>' +
          '<strong>' + money(item.subtotal) + '</strong>' +
        '</div>';
      }).join("");

    return '<div class="tq-price-breakdown">' +
      '<h5 class="mb-3">Passenger fare breakdown</h5>' +

      (rows || '<div>No passengers selected.</div>') +

      '<hr>' +

      '<div>' +
        '<span>Base fare · all passengers</span>' +
        '<strong>' + money(p.baseFare) + '</strong>' +
      '</div>' +

      '<div>' +
        '<span>Estimated taxes & fees (5%)</span>' +
        '<strong>' + money(p.taxAmount) + '</strong>' +
      '</div>' +

      '<div class="tq-grand-total">' +
        '<span>Estimated total</span>' +
        '<strong>' + money(p.totalFare) + '</strong>' +
      '</div>' +

      '<div class="small text-muted mt-2">' +
        'Demo pricing assumptions: adults 100%, children 75%, ' +
        'infants 25% of the adult demo fare. These are not actual ' +
        'airline fare rules. Final fares, taxes and availability ' +
        'must be reconfirmed before payment.' +
      '</div>' +
    '</div>';
  }

  // =========================================================
  // 17. SUMMARY AND REVIEW SCREEN
  // =========================================================

  function renderSummary() {
    if (!selectedOutbound || !search) return;

    const trip = itinerary();
    const p = trip.pricing;

    const leg = (o, label) =>
      '<div class="tq-summary-leg">' +

        '<div class="tq-summary-leg-title">' +
          label + ' · ' + formatDate(o.departureDate) +
        '</div>' +

        '<strong>' +
          safe(o.airline) + ' · ' + safe(o.flight) +
        '</strong>' +

        '<div class="tq-summary-route">' +
          safe(o.origin.label) + ' (' +
          safe(o.origin.code || "—") + ')' +
          ' → ' +
          safe(o.destination.label) + ' (' +
          safe(o.destination.code || "—") + ')' +
        '</div>' +

        '<div class="tq-summary-times">' +
          safe(o.depart) + ' – ' + safe(o.arrive) +
          ' · ' + durationText(o.duration) +
        '</div>' +

        connectionMarkup(o) +

        '<div class="tq-summary-fare">' +
          money(o.price) +
          ' adult demo fare per passenger' +
        '</div>' +

      '</div>';

    const legs =
      leg(selectedOutbound, "Outbound") +
      (selectedReturn
        ? leg(selectedReturn, "Return")
        : "");

    const html =
      '<div class="tq-booking-steps">' +
        '<span class="is-done">1. Departure</span>' +
        (search.tripType === "Round trip"
          ? '<span class="is-done">2. Return</span>'
          : "") +
        '<span class="is-active">Review & save</span>' +
      '</div>' +

      '<div class="tq-summary-card">' +

        '<div class="tq-summary-heading">' +
          '<div>' +
            '<span class="flight-demo-chip">' +
              'Your itinerary · Selected flights' +
            '</span>' +

            '<h3>' +
              safe(search.origin.label) + ' ↔ ' +
              safe(search.destination.label) +
            '</h3>' +

            '<p>' +
              search.tripType + ' · ' +
              passengers() + ' passenger(s) · ' +
              safe(search.cabin) +
            '</p>' +
          '</div>' +

          '<button type="button" class="btn btn-link" data-edit-flights>' +
            'Edit flights' +
          '</button>' +
        '</div>' +

        legs +

        fareBreakdownMarkup(p) +

        '<div class="tq-summary-actions">' +

          '<button type="button" class="btn btn-primary" data-book-itinerary>' +
            'Request booking' +
          '</button>' +

          '<button type="button" class="btn btn-outline-primary" data-save-wishlist>' +
            (wishlistId
              ? "Update saved trip"
              : "Save to wishlist") +
          '</button>' +

          '<button type="button" class="btn btn-outline-primary" data-share-itinerary="whatsapp">' +
            'WhatsApp' +
          '</button>' +

          '<button type="button" class="btn btn-outline-primary" data-share-itinerary="email">' +
            'Email' +
          '</button>' +

        '</div>' +

        '<p class="small text-muted mt-3 mb-0" data-itinerary-message>' +
          'Request a booking or save your selected itinerary.' +
        '</p>' +

      '</div>';

    const list = byId("flightResultsList");
    const empty = byId("flightResultsEmpty");
    const count = byId("flightResultsCount");

    if (!list || !empty || !count) return;

    list.innerHTML = html;

    count.textContent = "Complete itinerary selected";

    empty.classList.remove("is-visible");
    list.hidden = false;

    heading(
      "Review your trip",
      formatDate(search.departureDate) +
      (search.tripType === "Round trip"
        ? " · Return " + formatDate(search.returnDate)
        : " · One way")
    );
  }

  function showStage() {
    if (!search) return;

    if (stage === "summary") {
      renderSummary();
    } else {
      renderLegStage();
    }
  }

  // =========================================================
  // 18. CURRENCY EVENT
  // =========================================================

  document.addEventListener(
    "travelqila:currency-changed",
    () => {
      const budget = byId("maxPrice");
      const budgetOutput = byId("priceOutput");

      if (budget && budgetOutput) {
        budgetOutput.textContent = money(budget.value);
      }

      if (search) {
        showStage();
      }
    }
  );

  // =========================================================
  // 19. AUTHENTICATION
  // =========================================================

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
    return byId("itinerary-message") ||
      document.querySelector("[data-itinerary-message]");
  }

  // =========================================================
  // 20. WISHLIST
  // =========================================================

  async function saveWishlist(button) {
    const node = messageNode();
    const original = button?.innerHTML;

    if (button) {
      button.disabled = true;
      button.textContent = "Saving...";
    }

    try {
      const user = await signedInUser();
      const trip = itinerary();

      const title =
        search.origin.label + " to " + search.destination.label;

      if (wishlistId) {
        const { data, error } = await supabase
          .from("flight_wishlists")
          .update({
            title,
            itinerary: trip
          })
          .eq("id", wishlistId)
          .eq("user_id", user.id)
          .select("id")
          .single();

        if (error) throw error;

        if (!data) {
          throw new Error("Could not update this saved trip.");
        }
      } else {
        const { data, error } = await supabase
          .from("flight_wishlists")
          .insert({
            user_id: user.id,
            title,
            itinerary: trip
          })
          .select("id")
          .single();

        if (error) throw error;

        wishlistId = data.id;
      }

      if (node) {
        node.replaceChildren(
          document.createTextNode(
            "Your itinerary and passenger fare breakdown have been saved. "
          )
        );

        const viewWishlistLink = document.createElement("a");

        viewWishlistLink.href = "dashboard.html#wishlist";
        viewWishlistLink.className =
          "btn btn-sm btn-outline-primary ms-2";
        viewWishlistLink.textContent = "View Wishlist";

        viewWishlistLink.setAttribute(
          "aria-label",
          "View your saved flight wishlist"
        );

        node.appendChild(viewWishlistLink);
      }

      if (button) {
        button.textContent = "Saved successfully";
        button.disabled = false;
      }
    } catch (error) {
      console.error("Wishlist error:", error);

      if (node) node.textContent = error.message;

      if (button) {
        button.disabled = false;
        button.innerHTML = original;
      }
    }
  }

  // =========================================================
  // 21. BOOKING REQUEST
  // =========================================================

  async function requestBooking(trip, user) {
    const o = trip.outbound;
    const r = trip.return;
    const p = trip.pricing;

    const payload = {
      user_id: user.id,
      origin: trip.origin.label,
      destination: trip.destination.label,
      origin_code: trip.origin.code || null,
      destination_code: trip.destination.code || null,
      trip_type: trip.tripType,
      departure_date: trip.departureDate,
      return_date:
        trip.tripType === "Round trip" ? trip.returnDate : null,
      adults: trip.passengers.adults,
      children: trip.passengers.children,
      infants: trip.passengers.infants,
      cabin_class: trip.cabin,
      airline: o.airline,
      flight_number: o.flight,
      departure_time: o.depart,
      arrival_time: o.arrive,
      return_airline: r?.airline || null,
      return_flight_number: r?.flight || null,
      return_departure_time: r?.depart || null,
      return_arrival_time: r?.arrive || null,
      base_fare: p.baseFare,
      tax_amount: p.taxAmount,
      demo_fare: p.totalFare,
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

  async function bookCurrent(button) {
    const node = messageNode();

    button.disabled = true;
    button.textContent = "Submitting...";

    try {
      const user = await signedInUser();
      const ref = await requestBooking(itinerary(), user);

      if (node) {
        node.textContent =
          "Booking request " + ref +
          " has been submitted. Travel Qila must reconfirm live " +
          "availability and final fare before ticketing.";
      }

      button.textContent = "Request submitted";
    } catch (error) {
      console.error("Booking request error:", error);

      if (node) node.textContent = error.message;

      button.disabled = false;
      button.textContent = "Request booking";
    }
  }

  // =========================================================
  // 22. ITINERARY SHARING
  // =========================================================

  function shareItinerary(channel) {
    const trip = itinerary();
    const p = trip.pricing;
    const o = trip.outbound;
    const r = trip.return;

    const lines = [
      "Hello Travel Qila, I would like to request this flight itinerary.",
      "Trip: " + trip.tripType,
      "Route: " + trip.origin.label + " to " +
        trip.destination.label,
      "Departure: " + formatDate(trip.departureDate),

      trip.tripType === "Round trip"
        ? "Return: " + formatDate(trip.returnDate)
        : "",

      "Passengers: " +
        trip.passengers.adults + " adult(s), " +
        trip.passengers.children + " child(ren), " +
        trip.passengers.infants + " infant(s)",

      "Cabin: " + trip.cabin,

      "Outbound: " + o.airline + " " + o.flight +
        " | " + money(o.price) + " adult demo fare",

      o.layovers?.length
        ? "Outbound connections: " +
          o.layovers.map(stop =>
            (stop.airport.city || stop.airport.code) +
            " (" + durationText(stop.duration) + " layover)"
          ).join(", ")
        : "Outbound: Non-stop",

      r ? "Return: " + r.airline + " " + r.flight +
        " | " + money(r.price) + " adult demo fare" : "",

      r?.layovers?.length
        ? "Return connections: " +
          r.layovers.map(stop =>
            (stop.airport.city || stop.airport.code) +
            " (" + durationText(stop.duration) + " layover)"
          ).join(", ")
        : (r ? "Return: Non-stop" : ""),

      "Passenger category breakdown:",

      ...p.categories
        .filter(item => item.count > 0)
        .map(item =>
          item.label + " (" + item.count + "): " +
          money(item.subtotal)
        ),

      "Base fare: " + money(p.baseFare),
      "Estimated tax: " + money(p.taxAmount),
      "Estimated total: " + money(p.totalFare),

      "This is a demo estimate and not a confirmed ticket."
    ].filter(Boolean);

    const message = lines.join("\n");

    if (channel === "whatsapp") {
      window.open(
        "https://wa.me/919871101345?text=" +
          encodeURIComponent(message),
        "_blank",
        "noopener,noreferrer"
      );
    }

    if (channel === "email") {
      window.location.href =
        "mailto:info@travelqila.com?subject=" +
        encodeURIComponent(
          "Travel Qila - Flight booking enquiry"
        ) +
        "&body=" + encodeURIComponent(message);
    }
  }

  // =========================================================
  // 23. CENTRAL RESULTS EVENT HANDLER
  // =========================================================

  results.addEventListener("click", async event => {
    const target = event.target.closest("button");

    if (!target) return;

    if (target.hasAttribute("data-select-leg")) {
      const id = target.dataset.offerId;
      const leg = target.dataset.selectLeg;

      const options =
        leg === "return" ? returnOptions : outboundOptions;

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
      await saveWishlist(target);

    } else if (target.hasAttribute("data-book-itinerary")) {
      await bookCurrent(target);

    } else if (target.hasAttribute("data-share-itinerary")) {
      shareItinerary(target.dataset.shareItinerary);
    }
  });

  // =========================================================
  // 24. TRIP TYPE CONTROLS
  // =========================================================

  function updateTripType() {
    const selectedTrip =
      form.querySelector('input[name="tripType"]:checked');

    if (!selectedTrip) return;

    const round = selectedTrip.value === "Round trip";

    const wrap = byId("returnDate");
    const container = byId("returnDateWrap");

    if (!wrap || !container) return;

    container.hidden = !round;
    wrap.required = round;

    if (!round) wrap.value = "";
  }

  form.querySelectorAll('input[name="tripType"]').forEach(input =>
    input.addEventListener("change", updateTripType)
  );

  // =========================================================
  // 25. PASSENGER FIELD EVENTS
  // =========================================================

  byId("adults")?.addEventListener("input", () => {
    syncInfantLimit();
  });

  byId("infants")?.addEventListener("change", () => {
    byId("infants").setCustomValidity("");
  });

  // =========================================================
  // 26. DATE CONTROLS
  // =========================================================

  byId("departDate")?.addEventListener("change", () => {
    const departure = byId("departDate");
    const returning = byId("returnDate");

    if (departure && returning) {
      returning.min = departure.value;
    }
  });

  // =========================================================
  // 27. CITY SWAP
  // =========================================================

  byId("swapCities")?.addEventListener("click", () => {
    const origin = byId("origin");
    const destination = byId("destination");

    if (!origin || !destination) return;

    const value = origin.value;

    origin.value = destination.value;
    destination.value = value;
  });

  // =========================================================
  // 28. MAIN SEARCH SUBMISSION
  // =========================================================

  form.addEventListener("submit", event => {
    event.preventDefault();

    updateTripType();

    [
      byId("adults"),
      byId("children"),
      byId("infants")
    ].forEach(input => input?.setCustomValidity(""));

    const passengerCounts = validatePassengerCounts();

    if (!passengerCounts) return;

    syncInfantLimit();

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

    const {
      adults,
      children,
      infants
    } = passengerCounts;

    const tripType =
      form.querySelector('input[name="tripType"]:checked')?.value;

    if (!tripType) {
      alert("Please select a trip type.");
      return;
    }

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
      departureDate: byId("departDate").value,

      returnDate: tripType === "Round trip"
        ? byId("returnDate").value
        : null,

      tripType,
      adults,
      children,
      infants,
      cabin: byId("cabin").value,
      stops: byId("stops").value,
      maximumBudget: Number(byId("maxPrice").value),
      dateFlexibility: byId("flexibility").value,
      additionalPreferences: byId("notes").value.trim()
    };

    selectedOutbound = null;
    selectedReturn = null;
    wishlistId = null;
    stage = "outbound";

    resultFilters = {
      stops:
        search.stops === "Non-stop only"
          ? "nonstop"
          : search.stops === "1 stop or fewer"
            ? "one"
            : "any",
      airline: "all",
      sort: "price"
    };

    outboundOptions = makeOptions(
      origin,
      destination,
      search.departureDate,
      origin.code + destination.code
    );

    returnOptions = tripType === "Round trip"
      ? makeOptions(
          destination,
          origin,
          search.returnDate,
          destination.code + origin.code
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
  });

  // =========================================================
  // 29. URL PARAMETERS
  // =========================================================

  const params = new URLSearchParams(window.location.search);

  wishlistId = params.get("wishlistId") || null;

  if (params.has("origin") && params.has("destination")) {
    byId("origin").value = params.get("origin") || "";
    byId("destination").value = params.get("destination") || "";

    const trip = params.get("tripType") === "Round trip"
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

  // =========================================================
  // 30. DATE INITIALIZATION
  // =========================================================

  const now = new Date();

  now.setMinutes(
    now.getMinutes() - now.getTimezoneOffset()
  );

  const today = now.toISOString().slice(0, 10);

  byId("departDate").min = today;
  byId("returnDate").min = today;

  // =========================================================
  // 31. BUDGET DISPLAY
  // =========================================================

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

  // =========================================================
  // 32. RESTORE SEARCH PARAMETERS
  // =========================================================

  if (params.has("stops") && byId("stops")) {
    byId("stops").value = params.get("stops");
  }

  if (params.has("maximumBudget") && budget) {
    budget.value = params.get("maximumBudget");
  }

  if (params.has("dateFlexibility") && byId("flexibility")) {
    byId("flexibility").value =
      params.get("dateFlexibility");
  }

  if (params.has("additionalPreferences") && byId("notes")) {
    byId("notes").value =
      params.get("additionalPreferences");
  }

  // =========================================================
  // 33. FINAL INITIALIZATION
  // =========================================================

  syncInfantLimit();
  syncBudget();
  updateTripType();

  if (byId("departDate").value) {
    byId("returnDate").min = byId("departDate").value;
  }

  // =========================================================
  // 34. AUTO-SEARCH FROM URL
  // =========================================================

  if (
    params.has("origin") &&
    params.has("destination") &&
    params.has("departureDate")
  ) {
    const validOrigin = byId("origin").value.trim();
    const validDestination = byId("destination").value.trim();
    const validDeparture = byId("departDate").value;

    const selectedTrip =
      form.querySelector('input[name="tripType"]:checked');

    const validReturn =
      selectedTrip?.value !== "Round trip" ||
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
