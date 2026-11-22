import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0,10) === value;
}
function text(value, min = 2, max = 120) {
  return typeof value === "string" && value.trim().length >= min && value.trim().length <= max;
}
function time(value) { return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value); }

export async function POST(request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in to request this itinerary." }, { status: 401 });

    const body = await request.json();
    if (!body || typeof body.wishlistId !== "string" || body.wishlistId.length > 80) {
      return NextResponse.json({ error: "Invalid saved itinerary." }, { status: 400 });
    }
    const { data: saved, error: savedError } = await supabase.from("flight_wishlists").select("itinerary").eq("id", body.wishlistId).eq("user_id", user.id).single();
    if (savedError || !saved?.itinerary) return NextResponse.json({ error: "Saved itinerary not found." }, { status: 404 });

    const itinerary = saved.itinerary;
    const outbound = itinerary.outbound;
    const returning = itinerary.return;
    const pricing = itinerary.pricing;
    const passengers = itinerary.passengers;
    const roundTrip = itinerary.tripType === "Round trip";
    const passengerCountsValid = passengers && Number.isInteger(passengers.adults) && passengers.adults >= 1 && passengers.adults <= 9 &&
      Number.isInteger(passengers.children) && passengers.children >= 0 && passengers.children <= 6 &&
      Number.isInteger(passengers.infants) && passengers.infants >= 0 && passengers.infants <= passengers.adults;
    if (!text(itinerary.origin?.label) || !text(itinerary.destination?.label) ||
      itinerary.origin.label.toLowerCase() === itinerary.destination.label.toLowerCase() ||
      !validDate(itinerary.departureDate) || (roundTrip && (!validDate(itinerary.returnDate) || itinerary.returnDate < itinerary.departureDate)) ||
      !passengerCountsValid || !["Economy","Premium Economy","Business","First Class"].includes(itinerary.cabin) ||
      !outbound || !text(outbound.airline,2,80) || !text(outbound.flight,2,20) || !time(outbound.depart) || !time(outbound.arrive) ||
      !pricing || !Number.isFinite(Number(pricing.baseFare)) || !Number.isFinite(Number(pricing.taxAmount)) || !Number.isFinite(Number(pricing.totalFare)) ||
      Number(pricing.baseFare) < 0 || Number(pricing.taxAmount) < 0 || Number(pricing.totalFare) < 0 ||
      (roundTrip && (!returning || !text(returning.airline,2,80) || !text(returning.flight,2,20) || !time(returning.depart) || !time(returning.arrive)))) {
      return NextResponse.json({ error: "This saved itinerary is incomplete." }, { status: 422 });
    }

    const payload = {
      user_id: user.id,
      origin: itinerary.origin.label.trim(),
      destination: itinerary.destination.label.trim(),
      origin_code: /^[A-Z]{3}$/.test(itinerary.origin.code || "") ? itinerary.origin.code : null,
      destination_code: /^[A-Z]{3}$/.test(itinerary.destination.code || "") ? itinerary.destination.code : null,
      trip_type: roundTrip ? "Round trip" : "One way",
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
    const { data: booking, error: insertError } = await supabase.from("flight_bookings").insert(payload).select("booking_reference").single();
    if (insertError) return NextResponse.json({ error: "Your booking request could not be saved. Please try again." }, { status: 400 });
    return NextResponse.json({ bookingReference: booking.booking_reference }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "We couldn't complete your request. Please try again." }, { status: 400 });
  }
}
