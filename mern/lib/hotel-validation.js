import { HOTEL_CATALOG } from "./hotel-catalog.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
function validDate(value) {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
function indiaToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
}

export function validateHotelRequest(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new TypeError("Invalid hotel request.");
  const hotel = HOTEL_CATALOG.find(item => item.id === input.hotelId);
  if (!hotel) throw new TypeError("This hotel is no longer available. Please search again.");
  const { checkIn, checkOut } = input;
  if (!validDate(checkIn) || !validDate(checkOut) || checkIn < indiaToday() || checkOut <= checkIn) {
    throw new TypeError("Choose valid check-in and check-out dates.");
  }
  const nights = Math.round((Date.parse(checkOut + "T00:00:00Z") - Date.parse(checkIn + "T00:00:00Z")) / 86400000);
  if (nights > 90) throw new TypeError("Please contact our team for stays longer than 90 nights.");
  const guests = Number(input.guests);
  const rooms = Number(input.rooms ?? 1);
  if (!Number.isInteger(guests) || guests < 1 || guests > 12 || !Number.isInteger(rooms) || rooms < 1 || rooms > 6 || guests > hotel.maxGuests * rooms) {
    throw new TypeError("The selected guest and room count is not valid for this stay.");
  }
  const base = hotel.rate * nights * rooms;
  const taxes = Math.round(base * 0.12);
  return {
    hotel,
    nights,
    guests,
    rooms,
    base,
    taxes,
    total: base + taxes,
    checkIn,
    checkOut
  };
}
