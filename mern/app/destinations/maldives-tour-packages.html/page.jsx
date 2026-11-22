import DestinationPage from "@/components/destination-page";
import {destinationBySlug} from "@/lib/destination-data";
import "../../destinations.css";
export const metadata = {
  title: "Maldives Tour Packages | Travel Qila",
  description: "Explore Maldives holiday ideas and request a customised itinerary with Travel Qila.",
  alternates: { canonical: "/destinations/maldives-tour-packages.html" }
};
export default function Page(){return <DestinationPage destination={destinationBySlug["maldives"]}/>;}
