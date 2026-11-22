import test from "node:test";
import assert from "node:assert/strict";
import { validateHotelRequest } from "./hotel-validation.js";

test("calculates hotel request totals on the server from the catalogue", () => {
  const result = validateHotelRequest({ hotelId: "goa-seabreeze", checkIn: "2027-02-01", checkOut: "2027-02-04", guests: 2 });
  assert.equal(result.nights, 3);
  assert.equal(result.base, 21600);
  assert.equal(result.taxes, 2592);
  assert.equal(result.total, 24192);
});

test("rejects unknown hotels, invalid dates, excessive stays and capacity", () => {
  assert.throws(() => validateHotelRequest({ hotelId: "unknown", checkIn: "2027-02-01", checkOut: "2027-02-04", guests: 2 }));
  assert.throws(() => validateHotelRequest({ hotelId: "goa-seabreeze", checkIn: "2027-02-04", checkOut: "2027-02-01", guests: 2 }));
  assert.throws(() => validateHotelRequest({ hotelId: "goa-seabreeze", checkIn: "2027-02-01", checkOut: "2027-06-01", guests: 2 }));
  assert.throws(() => validateHotelRequest({ hotelId: "goa-seabreeze", checkIn: "2027-02-01", checkOut: "2027-02-04", guests: 5 }));
});

test("multiplies server-verified hotel totals by room count", () => {
  const result = validateHotelRequest({ hotelId: "goa-seabreeze", checkIn: "2027-02-01", checkOut: "2027-02-04", guests: 6, rooms: 2 });
  assert.equal(result.base, 43200);
  assert.equal(result.taxes, 5184);
  assert.equal(result.total, 48384);
});
