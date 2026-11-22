import test from "node:test";
import assert from "node:assert/strict";
import { requiredString, safeHttpsUrl, safeDateRange } from "./validation.js";

test("requiredString trims valid input and rejects empty or oversized values", () => {
  assert.equal(requiredString("  Delhi  ", "origin"), "Delhi");
  assert.throws(() => requiredString("  ", "origin"));
  assert.throws(() => requiredString("x".repeat(201), "origin"));
});

test("safeHttpsUrl accepts HTTPS and rejects unsafe schemes and credentials", () => {
  assert.equal(safeHttpsUrl("https://images.example.com/photo.jpg"), "https://images.example.com/photo.jpg");
  assert.throws(() => safeHttpsUrl("javascript:alert(1)"));
  assert.throws(() => safeHttpsUrl("https://user:pass@example.com"));
});

test("safeDateRange requires valid dates and checkout after checkin", () => {
  assert.deepEqual(safeDateRange("2027-01-01", "2027-01-03"), { checkIn: "2027-01-01", checkOut: "2027-01-03" });
  assert.throws(() => safeDateRange("2027-01-03", "2027-01-01"));
  assert.throws(() => safeDateRange("2027-02-30", "2027-03-02"));
});
