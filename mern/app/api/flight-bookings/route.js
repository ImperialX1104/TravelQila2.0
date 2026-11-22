import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateFlightItinerary } from "@/lib/flight-validation";

export async function POST(request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in to request this itinerary." }, { status: 401 });
    const itinerary = await request.json();
    const payload = validateFlightItinerary(itinerary);
    payload.user_id = user.id;
    const { data, error } = await supabase.from("flight_bookings").insert(payload).select("booking_reference").single();
    if (error) return NextResponse.json({ error: "Your booking request could not be saved. Please try again." }, { status: 400 });
    return NextResponse.json({ bookingReference: data.booking_reference }, { status: 201 });
  } catch (error) {
    const message = error instanceof TypeError ? error.message : "We couldn't complete your request. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
