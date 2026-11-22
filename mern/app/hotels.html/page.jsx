import HotelSearch from "@/components/hotel-search";
import "./hotels.css";
export const metadata = {
  title: "Hotel Booking Assistance | Domestic & International Hotels",
  description: "Request hotel options with Travel Qila. Share your destination, dates, guests and budget for personalised hotel booking assistance.",
  alternates: { canonical: "/hotels.html" }
};
export default function HotelsPage() { return <main><HotelSearch /></main>; }
