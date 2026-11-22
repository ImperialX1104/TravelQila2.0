import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import DashboardClient from "@/components/dashboard-client";
import "../dashboard.css";

export const metadata = { title: "My Dashboard", description: "Manage your Travel Qila profile and travel requests.", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const supabase = await getSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect("/login.html?returnTo=%2Fdashboard.html");

  const [bookings, wishlist, hotelWishlist, hotelBookings] = await Promise.all([
    supabase.from("flight_bookings").select("id,booking_reference,origin,destination,origin_code,destination_code,trip_type,departure_date,return_date,adults,children,infants,cabin_class,additional_preferences,airline,flight_number,departure_time,arrival_time,return_airline,return_flight_number,return_departure_time,return_arrival_time,demo_fare,status,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("flight_wishlists").select("id,title,itinerary,created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("hotel_wishlists").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase.from("hotel_booking_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false })
  ]);

  return <main className="dashboard-main"><DashboardClient
    user={{ id: user.id, email: user.email, createdAt: user.created_at, metadata: user.user_metadata || {} }}
    initial={{ bookings: bookings.data || [], wishlist: wishlist.data || [], hotelWishlist: hotelWishlist.data || [], hotelBookings: hotelBookings.data || [] }}
    loadErrors={{ bookings: Boolean(bookings.error), wishlist: Boolean(wishlist.error), hotelWishlist: Boolean(hotelWishlist.error), hotelBookings: Boolean(hotelBookings.error) }}
  /></main>;
}
