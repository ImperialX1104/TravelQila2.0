import FlightSearch from "@/components/flight-search";
import "./services.css";
export const metadata = {
  title: "Book Flights | Domestic & International Air Tickets",
  description: "Find your next flight with Travel Qila. Share your route, travel dates, passengers and budget to receive personalised domestic and international flight options.",
  alternates: { canonical: "/services.html" }
};
export default function FlightsPage() { return <main><FlightSearch /></main>; }
