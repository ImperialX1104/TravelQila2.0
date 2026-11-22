import test from "node:test";
import assert from "node:assert/strict";
import { parseAirport, buildFlightOptions } from "./flight-catalog.js";
import { validateFlightItinerary } from "./flight-validation.js";

function makeSample(tripType = "Round trip") {
  const origin = parseAirport("New Delhi (DEL)");
  const destination = parseAirport("Mumbai (BOM)");
  const searchDepartureDate = "2027-01-10";
  const searchReturnDate = tripType === "Round trip" ? "2027-01-15" : null;
  const outbound = buildFlightOptions(origin,destination,searchDepartureDate,"DELBOM","Exact dates")[0];
  const returning = tripType === "Round trip"
    ? buildFlightOptions(destination,origin,searchReturnDate,"BOMDEL","Exact dates")[1]
    : null;
  const passengers = { adults: 2, children: 1, infants: 0 };
  const baseFare = (outbound.price + (returning?.price || 0)) * 3;
  const taxAmount = Math.round(baseFare * .05);
  return {
    version: 1,
    tripType,
    origin,
    destination,
    searchDepartureDate,
    searchReturnDate,
    departureDate: outbound.departureDate,
    returnDate: returning?.departureDate || null,
    dateFlexibility: "Exact dates",
    passengers,
    cabin: "Economy",
    outbound,
    return: returning,
    pricing: { baseFare, taxAmount, totalFare: baseFare + taxAmount },
    additionalPreferences: "Window seat",
    priceSource: "illustrative_demo"
  };
}

test("normalizes a server-verified round-trip demo itinerary",()=>{
  const payload=validateFlightItinerary(makeSample());
  assert.equal(payload.origin,"New Delhi");
  assert.equal(payload.trip_type,"Round trip");
  assert.equal(payload.user_id,null);
  assert.ok(payload.demo_fare > 0);
});

test("rejects tampered flight prices and fare totals",()=>{
  const sample=makeSample();
  assert.throws(()=>validateFlightItinerary({...sample,outbound:{...sample.outbound,price:1}}),/fare has changed/i);
  assert.throws(()=>validateFlightItinerary({...sample,pricing:{...sample.pricing,totalFare:1}}),/fare total/i);
});

test("rejects unsupported airports, invalid dates and passenger counts",()=>{
  const sample=makeSample();
  assert.throws(()=>validateFlightItinerary({...sample,destination:{label:"Unknown",code:"ZZZ"}}));
  assert.throws(()=>validateFlightItinerary({...sample,searchDepartureDate:"2027-02-30"}));
  assert.throws(()=>validateFlightItinerary({...sample,passengers:{...sample.passengers,infants:3}}));
});

test("one-way itinerary clears all return fields and validates its fare",()=>{
  const sample=makeSample("One way");
  const payload=validateFlightItinerary(sample);
  assert.equal(payload.return_date,null);
  assert.equal(payload.return_airline,null);
  assert.equal(payload.return_flight_number,null);
});
