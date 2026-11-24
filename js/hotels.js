
import { supabase, authPageUrl } from "./auth-client.js";

const HOTEL_FUNCTION = "search-hotels";
const WHATSAPP_NUMBER = "919871101345";

const form = document.querySelector("#hotelSearchForm");
const results = document.querySelector("#hotelResults");
const statusBox = document.querySelector("#hotelStatus");
const resultCount = document.querySelector("#resultCount");

let user = null;
let wishlistIds = new Set();
let hotels = new Map();
let searchSequence = 0;

function message(text, type = "info") {
  if (!statusBox) return;
  statusBox.className = "hotel-status is-visible " + type;
  statusBox.textContent = text;
}

function clearMessage() {
  if (!statusBox) return;
  statusBox.className = "hotel-status";
  statusBox.textContent = "";
}

function safe(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[c]);
}

function dateNights(start, end) {
  if (!start || !end) return 0;

  return Math.round(
    (new Date(`${end}T00:00:00`) -
      new Date(`${start}T00:00:00`)) / 86400000
  );
}

function searchState() {
  const data = new FormData(form);

  return {
    destination: String(data.get("destination") || "").trim(),
    checkIn: String(data.get("checkIn") || ""),
    checkOut: String(data.get("checkOut") || ""),
    guests: Math.max(1, Number(data.get("guests")) || 1),
    stars: Number(data.get("stars")) || 0,
    maxPrice: Number(data.get("maxPrice")) || 0
  };
}

function formatMoney(amount, currencyCode = "INR") {
  const value = Number(amount);

  if (!Number.isFinite(value)) return "Price unavailable";

  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      maximumFractionDigits: 0
    }).format(value);
  } catch {
    return `${currencyCode} ${Math.round(value).toLocaleString("en-IN")}`;
  }
}

function validImage(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function mapHotel(item, fallbackCurrency = "INR") {
  const price = item.price || {};
  const location = item.location || {};
  const fees = price.fees || {};

  const numeric = (value) => {
    const number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : 0;
  };

  const id = String(
    item.id ||
    `${item.platform || "provider"}_${item.platformListingId || item.name}`
  );

  const images = Array.isArray(item.images) ? item.images : [];
  const amenities = Array.isArray(item.amenities)
    ? item.amenities
    : [];

  const feeCleaning = numeric(fees.cleaning);
  const feeService = numeric(fees.service);
  const feeTaxes = numeric(fees.taxes);

  return {
    id,
    name: item.name || "Unnamed accommodation",
    city: location.city || location.address || "",
    region: location.region || "",
    country: location.country || "",
    address: location.address || "",
    propertyType: item.propertyType || "accommodation",
    stars: item.starRating == null ? null : numeric(item.starRating),
    guestRating: item.guestRating == null
      ? null
      : numeric(item.guestRating),
    ratingScale: numeric(item.ratingScale) || 5,
    reviewCount: numeric(item.reviewCount),
    guests: numeric(item.maxOccupancy),
    bedrooms: numeric(item.bedrooms),
    bathrooms: numeric(item.bathrooms),
    amenities,
    image: validImage(images[0]),
    platform: item.platform || price.platform || "provider",
    url: validImage(item.url) ? item.url : "",
    currency: String(price.currency || fallbackCurrency).toUpperCase(),
    nightlyRate: numeric(price.nightlyPrice),
    providerTotal: numeric(price.totalPrice),
    nights: numeric(price.nights),
    feeCleaning,
    feeService,
    feeTaxes,
    feeTotal: feeCleaning + feeService + feeTaxes
  };
}

function quote(hotel, state) {
  const nights = dateNights(state.checkIn, state.checkOut);
  const base = hotel.providerTotal > 0
    ? hotel.providerTotal
    : hotel.nightlyRate * nights;

  const total = base + hotel.feeTotal;

  return {
    nights,
    base,
    cleaning: hotel.feeCleaning,
    service: hotel.feeService,
    taxes: hotel.feeTaxes,
    fees: hotel.feeTotal,
    total,
    currency: hotel.currency
  };
}

function propertyLabel(type) {
  const labels = {
    hotel: "Hotel",
    apartment: "Apartment",
    house: "House",
    villa: "Villa",
    guesthouse: "Guesthouse",
    resort: "Resort"
  };

  return labels[String(type || "").toLowerCase()] || "Stay";
}

function renderEmpty(title, description) {
  results.innerHTML = `
    <div class="hotel-empty">
      <i class="fas fa-search"></i>
      <h3>${safe(title)}</h3>
      <p>${safe(description)}</p>
    </div>
  `;
  resultCount.textContent = "";
}

function renderHotels() {
  const state = searchState();

  if (!state.destination || !state.checkIn || !state.checkOut) {
    renderEmpty(
      "Start with your destination",
      "Enter a city and valid check-in/check-out dates to explore stays."
    );
    return;
  }

  const nights = dateNights(state.checkIn, state.checkOut);

  if (nights < 1) {
    renderEmpty(
      "Choose valid stay dates",
      "Your check-out date must be after your check-in date."
    );
    return;
  }

  const found = [...hotels.values()]
    .filter((hotel) => {
      if (hotel.guests && hotel.guests < state.guests) return false;

      if (
        state.stars &&
        (hotel.stars === null || hotel.stars < state.stars)
      ) {
        return false;
      }

      const total = quote(hotel, state).total;

      if (state.maxPrice && total > state.maxPrice) return false;

      return true;
    })
    .map((hotel) => ({
      ...hotel,
      quote: quote(hotel, state)
    }));

  resultCount.textContent =
    `${found.length} stay${found.length === 1 ? "" : "s"} matching your search`;

  if (!found.length) {
    renderEmpty(
      "No stays match these filters",
      "Try a lower star rating, a higher budget or different guest count."
    );
    return;
  }

  results.innerHTML = found.map((hotel) => {
    const saved = wishlistIds.has(hotel.id);
    const image = hotel.image
      ? `<img src="${safe(hotel.image)}" alt="${safe(hotel.name)}"
           loading="lazy"
           onerror="this.style.display='none'">`
      : "";

    const rating = hotel.guestRating !== null
      ? `<span>★ ${safe(hotel.guestRating)} / ${safe(hotel.ratingScale)}
          (${hotel.reviewCount} reviews)</span>`
      : `<span>Guest rating unavailable</span>`;

    const stars = hotel.stars
      ? `${"★".repeat(Math.min(5, hotel.stars))} <span>${hotel.stars}-star property</span>`
      : `<span>Star classification unavailable</span>`;

    const location = [
      hotel.address || hotel.city,
      hotel.region,
      hotel.country
    ].filter(Boolean).join(", ");

    const amenities = hotel.amenities.slice(0, 6).map((item) =>
      `<span>${safe(String(item).replaceAll("_", " "))}</span>`
    ).join("");

    const nightly = hotel.nightlyRate > 0
      ? `${formatMoney(hotel.nightlyRate, hotel.currency)} <small>/ night</small>`
      : "Nightly rate unavailable";

    const total = hotel.quote.total > 0
      ? formatMoney(hotel.quote.total, hotel.currency)
      : "Price unavailable";

    const feeLines = [
      hotel.quote.cleaning > 0
        ? `Cleaning: ${formatMoney(hotel.quote.cleaning, hotel.currency)}`
        : "",
      hotel.quote.service > 0
        ? `Service: ${formatMoney(hotel.quote.service, hotel.currency)}`
        : "",
      hotel.quote.taxes > 0
        ? `Taxes: ${formatMoney(hotel.quote.taxes, hotel.currency)}`
        : ""
    ].filter(Boolean).join(" · ");

    return `
      <article class="hotel-result">
        <div class="hotel-photo">
          ${image}
          <span>${safe(propertyLabel(hotel.propertyType))}</span>
        </div>

        <div class="hotel-info">
          <div class="hotel-stars">${stars}</div>
          <h3>${safe(hotel.name)}</h3>

          <p class="hotel-location">
            <i class="fas fa-map-marker-alt"></i>
            ${safe(location || "Location details unavailable")}
          </p>

          <div class="hotel-amenities">${amenities}</div>

          <small class="hotel-capacity">
            <i class="fas fa-user-friends"></i>
            ${hotel.guests
              ? `Up to ${hotel.guests} guests`
              : "Guest capacity unavailable"}
          </small>

          <small class="hotel-capacity">${rating}</small>

          <small class="hotel-capacity">
            Provider: ${safe(hotel.platform)}
          </small>
        </div>

        <div class="hotel-price">
          <div class="hotel-rate">${nightly}</div>

          <div class="hotel-total">
            ${total}
            <small>estimated total</small>
          </div>

          <div class="hotel-breakdown">
            ${hotel.quote.nights} nights
            ${feeLines ? ` · ${safe(feeLines)}` : ""}
            <br>Provider-reported prices; final charges may vary.
          </div>

          <button class="btn btn-primary hotel-book"
            data-book="${safe(hotel.id)}"
            ${hotel.quote.total <= 0 ? "disabled" : ""}>
            Send booking enquiry
          </button>

          <button class="btn hotel-wish ${saved ? "saved" : ""}"
            data-wish="${safe(hotel.id)}">
            <i class="fas fa-heart"></i>
            ${saved ? "Saved to wishlist" : "Save to wishlist"}
          </button>

          ${hotel.url
            ? `<a class="hotel-provider-link"
                 href="${safe(hotel.url)}"
                 target="_blank"
                 rel="noopener noreferrer">View provider listing</a>`
            : ""}
        </div>
      </article>
    `;
  }).join("");
}

async function searchHotels() {
  const state = searchState();

  if (!state.destination || !state.checkIn || !state.checkOut) {
    message("Enter a destination and both stay dates.", "error");
    return;
  }

  if (dateNights(state.checkIn, state.checkOut) < 1) {
    message("Check-out must be after check-in.", "error");
    return;
  }

  const currentRequest = ++searchSequence;

  clearMessage();
  hotels.clear();
  resultCount.textContent = "";
  results.innerHTML = `
    <div class="hotel-empty">
      <i class="fas fa-spinner fa-spin"></i>
      <h3>Searching available stays...</h3>
      <p>Getting accommodation results from our hotel provider.</p>
    </div>
  `;

  const { data, error } = await supabase.functions.invoke(
    HOTEL_FUNCTION,
    {
      body: {
        location: state.destination,
        checkIn: state.checkIn,
        checkOut: state.checkOut,
        adults: state.guests,
        rooms: 1,
        currency: "INR",
        limit: 40
      }
    }
  );

  if (currentRequest !== searchSequence) return;

  if (error) {
    console.error("[Travel Qila] Hotel search error:", error);
    renderEmpty(
      "Hotel search is temporarily unavailable",
      "Please try again in a moment."
    );
    message(
      error.message || "Unable to contact the hotel search service.",
      "error"
    );
    return;
  }

  const listings = Array.isArray(data?.data) ? data.data : [];

  if (!listings.length) {
    renderEmpty(
      "No properties returned",
      "Try another destination or different dates."
    );
    message("The provider returned no accommodation results.", "info");
    return;
  }

  const fallbackCurrency = data?.meta?.currency || "INR";

  listings.forEach((item) => {
    const hotel = mapHotel(item, fallbackCurrency);
    hotels.set(hotel.id, hotel);
  });

  renderHotels();

  if (data?.meta?.sandbox) {
    message(
      "Sandbox results are sample properties, not live availability. Switch to a verified live API key to see real search results.",
      "info"
    );
  } else if (data?.meta?.partial) {
    message(
      "Some provider results may be missing. These results are not a confirmed booking.",
      "info"
    );
  } else {
    message(
      "Search results received. Availability and final prices must be confirmed by the provider.",
      "success"
    );
  }
}

async function loadWishlist() {
  if (!user) return;

  const { data, error } = await supabase
    .from("hotel_wishlists")
    .select("hotel_id")
    .eq("user_id", user.id);

  if (error) {
    console.warn(
      "[Travel Qila] Wishlist could not be loaded:",
      error.message
    );
    return;
  }

  wishlistIds = new Set((data || []).map((item) => String(item.hotel_id)));
}

async function toggleWishlist(id) {
  if (!user) {
    window.location.href =
      authPageUrl("login.html") + "?returnTo=hotels.html";
    return;
  }

  const hotel = hotels.get(id);

  if (!hotel) return;

  const state = searchState();
  const q = quote(hotel, state);

  if (wishlistIds.has(id)) {
    const { error } = await supabase
      .from("hotel_wishlists")
      .delete()
      .eq("user_id", user.id)
      .eq("hotel_id", id);

    if (error) {
      message("We couldn't remove this stay. Please try again.", "error");
      return;
    }

    wishlistIds.delete(id);
    message("Stay removed from your wishlist.", "success");
  } else {
    const { error } = await supabase
      .from("hotel_wishlists")
      .insert({
        user_id: user.id,
        hotel_id: id,
        hotel_name: hotel.name,
        destination: hotel.city || state.destination,
        star_rating: hotel.stars,
        nightly_rate: hotel.nightlyRate,
        taxes: q.taxes,
        total_price: q.total,
        currency: hotel.currency,
        image_url: hotel.image || null,
        check_in: state.checkIn || null,
        check_out: state.checkOut || null,
        guests: state.guests
      });

    if (error) {
      message(
        error.code === "23505"
          ? "This stay is already in your wishlist."
          : "We couldn't save this stay. Please try again.",
        "error"
      );
      return;
    }

    wishlistIds.add(id);
    message("Stay saved to your dashboard wishlist.", "success");
  }

  renderHotels();
}

async function bookHotel(id) {
  if (!user) {
    window.location.href =
      authPageUrl("login.html") + "?returnTo=hotels.html";
    return;
  }

  const state = searchState();
  const hotel = hotels.get(id);

  if (!hotel || dateNights(state.checkIn, state.checkOut) < 1) {
    message("Please choose valid check-in and check-out dates.", "error");
    return;
  }

  const q = quote(hotel, state);

  if (q.total <= 0) {
    message("A provider price is required before sending this enquiry.", "error");
    return;
  }

  const name =
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    "Traveller";

  const { data, error } = await supabase
    .from("hotel_booking_requests")
    .insert({
      user_id: user.id,
      hotel_id: hotel.id,
      hotel_name: hotel.name,
      destination: hotel.city || state.destination,
      check_in: state.checkIn,
      check_out: state.checkOut,
      guests: state.guests,
      rooms: 1,
      nightly_rate: hotel.nightlyRate,
      taxes: q.taxes,
      total_price: q.total,
      currency: hotel.currency,
      customer_name: name,
      customer_email: user.email || "Not provided",
      customer_phone: user.user_metadata?.phone || ""
    })
    .select("id")
    .single();

  if (error) {
    console.error("[Travel Qila] Booking enquiry error:", error);
    message(
      "Your request could not be saved. Please try again or contact our team.",
      "error"
    );
    return;
  }

  message(
    "Your hotel enquiry has been saved. Our team will contact you to confirm availability and the final rate.",
    "success"
  );

  const whatsappText = [
    "Hello Travel Qila, I would like to enquire about this stay.",
    `Property: ${hotel.name}`,
    `Destination: ${hotel.city || state.destination}`,
    `Provider: ${hotel.platform}`,
    `Check-in: ${state.checkIn}`,
    `Check-out: ${state.checkOut}`,
    `Guests: ${state.guests}`,
    `Estimated total: ${formatMoney(q.total, hotel.currency)}`,
    `Enquiry ID: ${data.id}`,
    hotel.url ? `Provider listing: ${hotel.url}` : ""
  ].filter(Boolean).join("\n");

  const link = document.querySelector("#hotelWhatsapp");

  if (link) {
    link.href =
      `https://wa.me/${WHATSAPP_NUMBER}?text=` +
      encodeURIComponent(whatsappText);
    link.hidden = false;
  }
}

form?.addEventListener("submit", async (event) => {
  event.preventDefault();
  await searchHotels();

  document.querySelector("#hotelResultsHeading")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
});

results?.addEventListener("click", async (event) => {
  const wish = event.target.closest("[data-wish]");
  const book = event.target.closest("[data-book]");

  if (wish) await toggleWishlist(wish.dataset.wish);
  if (book) await bookHotel(book.dataset.book);
});

(async () => {
  const checkIn = document.querySelector("#checkIn");
  const checkOut = document.querySelector("#checkOut");

  if (checkIn && checkOut) {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());

    const minimumDate = today.toISOString().slice(0, 10);

    checkIn.min = minimumDate;
    checkOut.min = minimumDate;

    checkIn.addEventListener("change", () => {
      checkOut.min = checkIn.value || minimumDate;

      if (checkOut.value && checkOut.value <= checkIn.value) {
        checkOut.value = "";
      }
    });
  }

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.warn("[Travel Qila] Could not retrieve current user:", error.message);
  }

  user = data?.user || null;

  await loadWishlist();

  renderEmpty(
    "Start with your destination",
    "Enter a city and valid check-in/check-out dates to explore stays."
  );
})();
