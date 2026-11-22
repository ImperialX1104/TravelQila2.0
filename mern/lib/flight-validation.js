import { AIRPORT_MAP, parseAirport, buildFlightOptions } from "./flight-catalog.js";

const AIRPORT_CODE = /^[A-Z]{3}$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const CABINS = new Set(["Economy","Premium Economy","Business","First Class"]);
const FLEXIBILITY = new Set(["Exact dates","1 day before or after","3 days before or after","Flexible - lowest fare matters most"]);

const isDate = value => {
  if (typeof value !== "string" || !DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0,10) === value;
};
const boundedText = (value, min, max) => typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
const sameLeg = (submitted, expected) => Boolean(
  submitted && expected &&
  submitted.id === expected.id &&
  submitted.airline === expected.airline &&
  submitted.flight === expected.flight &&
  submitted.depart === expected.depart &&
  submitted.arrive === expected.arrive &&
  Number(submitted.duration) === expected.duration &&
  Number(submitted.stops) === expected.stops &&
  Number(submitted.price) === expected.price &&
  submitted.baggage === expected.baggage &&
  submitted.departureDate === expected.departureDate &&
  submitted.origin?.code === expected.origin.code &&
  submitted.destination?.code === expected.destination.code
);

export function validateFlightItinerary(itinerary) {
  if (!itinerary || typeof itinerary !== "object" || Array.isArray(itinerary)) throw new TypeError("Invalid itinerary.");
  const roundTrip = itinerary.tripType === "Round trip";
  if (!roundTrip && itinerary.tripType !== "One way") throw new TypeError("Invalid trip type.");

  const { origin, destination, passengers, pricing, outbound, return: returning } = itinerary;
  if (!origin || !destination ||
      !boundedText(origin.label,2,120) || !boundedText(destination.label,2,120) ||
      !AIRPORT_CODE.test(origin.code || "") || !AIRPORT_CODE.test(destination.code || "") ||
      !AIRPORT_MAP[origin.code] || !AIRPORT_MAP[destination.code] ||
      origin.label !== AIRPORT_MAP[origin.code] || destination.label !== AIRPORT_MAP[destination.code] ||
      origin.code === destination.code) {
    throw new TypeError("Choose two different supported airports.");
  }

  const searchDepartureDate = itinerary.searchDepartureDate || itinerary.departureDate;
  const searchReturnDate = roundTrip ? (itinerary.searchReturnDate || itinerary.returnDate) : null;
  const flexibility = itinerary.dateFlexibility || "Exact dates";
  if (!FLEXIBILITY.has(flexibility) || !isDate(searchDepartureDate) ||
      (roundTrip && (!isDate(searchReturnDate) || searchReturnDate < searchDepartureDate))) {
    throw new TypeError("Choose valid travel dates and date flexibility.");
  }
  if (!isDate(itinerary.departureDate) || (roundTrip && (!isDate(itinerary.returnDate) || itinerary.returnDate < itinerary.departureDate))) {
    throw new TypeError("Choose valid selected flight dates.");
  }

  if (!passengers || !Number.isInteger(passengers.adults) || passengers.adults < 1 || passengers.adults > 9 ||
      !Number.isInteger(passengers.children) || passengers.children < 0 || passengers.children > 6 ||
      !Number.isInteger(passengers.infants) || passengers.infants < 0 || passengers.infants > 6 ||
      passengers.infants > passengers.adults) {
    throw new TypeError("Passenger details are invalid.");
  }
  if (!CABINS.has(itinerary.cabin)) throw new TypeError("Choose a valid cabin class.");
  if (typeof itinerary.additionalPreferences !== "string" || itinerary.additionalPreferences.length > 600) {
    throw new TypeError("Additional preferences are invalid.");
  }
  if (itinerary.priceSource !== "illustrative_demo") throw new TypeError("This demo fare cannot be verified.");

  const from = parseAirport(`${origin.label} (${origin.code})`);
  const to = parseAirport(`${destination.label} (${destination.code})`);
  const outboundOptions = buildFlightOptions(from,to,searchDepartureDate,origin.code+destination.code,flexibility);
  const expectedOutbound = outboundOptions.find(option => option.id === outbound?.id);
  if (!sameLeg(outbound,expectedOutbound) || outbound.departureDate !== itinerary.departureDate) {
    throw new TypeError("The selected outbound fare has changed. Search again before submitting.");
  }

  let expectedReturn = null;
  if (roundTrip) {
    const returnOptions = buildFlightOptions(to,from,searchReturnDate,destination.code+origin.code,flexibility);
    expectedReturn = returnOptions.find(option => option.id === returning?.id);
    if (!sameLeg(returning,expectedReturn) || returning.departureDate !== itinerary.returnDate ||
        itinerary.returnDate < itinerary.departureDate) {
      throw new TypeError("The selected return fare has changed. Search again before submitting.");
    }
  } else if (returning !== null && returning !== undefined) {
    throw new TypeError("A one-way itinerary cannot contain a return flight.");
  }

  const passengerCount = passengers.adults + passengers.children + passengers.infants;
  const baseFare = (expectedOutbound.price + (expectedReturn?.price || 0)) * passengerCount;
  const taxAmount = Math.round(baseFare * 0.05);
  const totalFare = baseFare + taxAmount;
  if (!pricing || Number(pricing.baseFare) !== baseFare ||
      Number(pricing.taxAmount) !== taxAmount || Number(pricing.totalFare) !== totalFare) {
    throw new TypeError("The submitted fare total does not match the selected demo flights.");
  }

  return {
    user_id: null,
    origin: origin.label,
    destination: destination.label,
    origin_code: origin.code,
    destination_code: destination.code,
    trip_type: itinerary.tripType,
    departure_date: itinerary.departureDate,
    return_date: roundTrip ? itinerary.returnDate : null,
    adults: passengers.adults,
    children: passengers.children,
    infants: passengers.infants,
    cabin_class: itinerary.cabin,
    airline: expectedOutbound.airline,
    flight_number: expectedOutbound.flight,
    departure_time: expectedOutbound.depart,
    arrival_time: expectedOutbound.arrive,
    return_airline: roundTrip ? expectedReturn.airline : null,
    return_flight_number: roundTrip ? expectedReturn.flight : null,
    return_departure_time: roundTrip ? expectedReturn.depart : null,
    return_arrival_time: roundTrip ? expectedReturn.arrive : null,
    base_fare: baseFare,
    tax_amount: taxAmount,
    demo_fare: totalFare,
    additional_preferences: itinerary.additionalPreferences.slice(0,600)
  };
}
