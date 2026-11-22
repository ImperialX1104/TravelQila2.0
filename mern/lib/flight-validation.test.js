import test from "node:test";
import assert from "node:assert/strict";
import { validateFlightItinerary } from "./flight-validation.js";

const sample = {
  tripType:"Round trip",origin:{label:"Delhi",code:"DEL"},destination:{label:"Mumbai",code:"BOM"},
  departureDate:"2027-01-10",returnDate:"2027-01-15",passengers:{adults:2,children:1,infants:0},cabin:"Economy",
  outbound:{airline:"IndiGo",flight:"6E 2145",depart:"06:10",arrive:"08:25",price:6500},
  return:{airline:"Air India",flight:"AI 887",depart:"17:30",arrive:"19:45",price:7500},
  pricing:{baseFare:28000,taxAmount:1400,totalFare:29400},additionalPreferences:"Window seat"
};

test("normalizes a valid round-trip itinerary for the authenticated insert",()=>{
  const payload=validateFlightItinerary(sample);
  assert.equal(payload.origin,"Delhi");
  assert.equal(payload.trip_type,"Round trip");
  assert.equal(payload.demo_fare,29400);
  assert.equal(payload.user_id,null);
});

test("rejects same-city, invalid dates, passenger counts and missing return leg",()=>{
  assert.throws(()=>validateFlightItinerary({...sample,destination:{label:"Delhi",code:"DEL"}}));
  assert.throws(()=>validateFlightItinerary({...sample,departureDate:"2027-02-30"}));
  assert.throws(()=>validateFlightItinerary({...sample,passengers:{...sample.passengers,infants:3}}));
  assert.throws(()=>validateFlightItinerary({...sample,return:null}));
});

test("one-way itinerary clears all return fields",()=>{
  const payload=validateFlightItinerary({...sample,tripType:"One way",returnDate:null,return:null});
  assert.equal(payload.return_date,null);
  assert.equal(payload.return_airline,null);
});
