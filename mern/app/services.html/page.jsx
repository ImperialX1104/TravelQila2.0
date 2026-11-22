import FlightSearch from "@/components/flight-search";
import { indiaToday, addDays } from "@/lib/date";
import "./services.css";
export const metadata = {
  title: "Book Flights | Domestic & International Air Tickets",
  description: "Find your next flight with Travel Qila. Share your route, travel dates, passengers and budget to receive personalised domestic and international flight options.",
  alternates: { canonical: "/services.html" }
};
export default async function FlightsPage({ searchParams }) {
  const params = await searchParams;
  const keys = ["origin","destination","tripType","departureDate","returnDate","adults","children","infants","cabin","stops","maximumBudget","dateFlexibility","additionalPreferences","wishlistId"];
  const initialSearch = {};
  for (const key of keys) {
    const value = Array.isArray(params?.[key]) ? params[key][0] : params?.[key];
    if (typeof value === "string") initialSearch[key] = value;
  }
  const today = indiaToday();
  if (!initialSearch.departureDate) initialSearch.departureDate = addDays(today, 7);
  if (initialSearch.tripType !== "One way" && !initialSearch.returnDate) initialSearch.returnDate = addDays(initialSearch.departureDate, 7);
  return <main><FlightSearch key={JSON.stringify(initialSearch)} initialSearch={initialSearch} minDate={today}/></main>;
}
