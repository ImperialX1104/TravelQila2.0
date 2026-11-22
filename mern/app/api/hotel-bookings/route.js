import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { validateHotelRequest } from "@/lib/hotel-validation";

export async function POST(request) {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: "Please sign in to request this hotel." }, { status: 401 });
    const body = await request.json();
    const quote = validateHotelRequest(body);
    const payload = {
      user_id: user.id,
      hotel_id: quote.hotel.id,
      hotel_name: quote.hotel.name,
      destination: quote.hotel.city,
      check_in: quote.checkIn,
      check_out: quote.checkOut,
      guests: quote.guests,
      rooms: quote.rooms,
      nightly_rate: quote.hotel.rate,
      taxes: quote.taxes,
      total_price: quote.total,
      currency: "INR",
      customer_name: String(user.user_metadata?.full_name || user.user_metadata?.name || "Traveller").slice(0, 100),
      customer_email: String(user.email || "Not provided").slice(0, 150),
      customer_phone: String(user.user_metadata?.phone || "").slice(0, 30)
    };
    const { data, error } = await supabase.from("hotel_booking_requests").insert(payload).select("id").single();
    if (error) return NextResponse.json({ error: "Your hotel request could not be saved. Please try again." }, { status: 400 });
    return NextResponse.json({ enquiryId: data.id, hotelName: quote.hotel.name, estimatedTotal: quote.total }, { status: 201 });
  } catch (error) {
    const message = error instanceof TypeError ? error.message : "We couldn't complete your request. Please try again.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
