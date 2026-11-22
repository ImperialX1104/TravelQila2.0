import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateFlightItinerary } from "@/lib/flight-validation";

export async function POST(request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in to request this itinerary." }, { status: 401 });

    const body = await request.json();
    if (!body || typeof body.wishlistId !== "string" || body.wishlistId.length > 80) {
      return NextResponse.json({ error: "Invalid saved itinerary." }, { status: 400 });
    }
    const { data: saved, error: savedError } = await supabase
      .from("flight_wishlists").select("itinerary")
      .eq("id", body.wishlistId).eq("user_id", user.id).single();
    if (savedError || !saved?.itinerary) return NextResponse.json({ error: "Saved itinerary not found." }, { status: 404 });

    const payload = validateFlightItinerary(saved.itinerary);
    payload.user_id = user.id;
    const { data: booking, error: insertError } = await supabase
      .from("flight_bookings").insert(payload).select("booking_reference").single();
    if (insertError) return NextResponse.json({ error: "Your booking request could not be saved. Please try again." }, { status: 400 });
    return NextResponse.json({ bookingReference: booking.booking_reference }, { status: 201 });
  } catch (error) {
    const message = error instanceof TypeError ? error.message : "We couldn't complete your request. Please try again.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
