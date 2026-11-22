const AIRPORT_CODE = /^[A-Z]{3}$/;
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CABINS = new Set(["Economy","Premium Economy","Business","First Class"]);

const isDate = value => {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
};
const boundedText = (value, min, max) => typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
const validMoney = value => Number.isFinite(Number(value)) && Number(value) >= 0;

export function validateFlightItinerary(itinerary) {
  if (!itinerary || typeof itinerary !== "object" || Array.isArray(itinerary)) throw new TypeError("Invalid itinerary.");
  const roundTrip = itinerary.tripType === "Round trip";
  if (!roundTrip && itinerary.tripType !== "One way") throw new TypeError("Invalid trip type.");
  const { origin, destination, passengers, pricing, outbound, return: returning } = itinerary;
  if (!origin || !destination || !boundedText(origin.label,2,120) || !boundedText(destination.label,2,120) || origin.label.trim().toLowerCase() === destination.label.trim().toLowerCase()) throw new TypeError("Choose two different valid cities.");
  if (!isDate(itinerary.departureDate) || (roundTrip && (!isDate(itinerary.returnDate) || itinerary.returnDate < itinerary.departureDate))) throw new TypeError("Choose valid travel dates.");
  if (!passengers || !Number.isInteger(passengers.adults) || passengers.adults < 1 || passengers.adults > 9 || !Number.isInteger(passengers.children) || passengers.children < 0 || passengers.children > 6 || !Number.isInteger(passengers.infants) || passengers.infants < 0 || passengers.infants > passengers.adults) throw new TypeError("Passenger details are invalid.");
  if (!CABINS.has(itinerary.cabin)) throw new TypeError("Choose a valid cabin class.");
  const validLeg = leg => leg && boundedText(leg.airline,2,80) && boundedText(leg.flight,2,20) && TIME.test(leg.depart || "") && TIME.test(leg.arrive || "") && validMoney(leg.price);
  if (!validLeg(outbound) || (roundTrip && !validLeg(returning))) throw new TypeError("Select all required flight legs.");
  if (!pricing || !validMoney(pricing.baseFare) || !validMoney(pricing.taxAmount) || !validMoney(pricing.totalFare)) throw new TypeError("Fare estimate is invalid.");
  return {
    user_id: null,
    origin: origin.label.trim(),
    destination: destination.label.trim(),
    origin_code: AIRPORT_CODE.test(origin.code || "") ? origin.code : null,
    destination_code: AIRPORT_CODE.test(destination.code || "") ? destination.code : null,
    trip_type: itinerary.tripType,
    departure_date: itinerary.departureDate,
    return_date: roundTrip ? itinerary.returnDate : null,
    adults: passengers.adults,
    children: passengers.children,
    infants: passengers.infants,
    cabin_class: itinerary.cabin,
    airline: outbound.airline.trim(),
    flight_number: outbound.flight.trim(),
    departure_time: outbound.depart,
    arrival_time: outbound.arrive,
    return_airline: roundTrip ? returning.airline.trim() : null,
    return_flight_number: roundTrip ? returning.flight.trim() : null,
    return_departure_time: roundTrip ? returning.depart : null,
    return_arrival_time: roundTrip ? returning.arrive : null,
    base_fare: Number(pricing.baseFare),
    tax_amount: Number(pricing.taxAmount),
    demo_fare: Number(pricing.totalFare),
    additional_preferences: typeof itinerary.additionalPreferences === "string" ? itinerary.additionalPreferences.slice(0,600) : null
  };
}
