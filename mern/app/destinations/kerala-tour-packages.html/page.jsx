import DestinationPage from "@/components/destination-page";
import {destinationBySlug} from "@/lib/destination-data";
import "../../destinations.css";
export const metadata = {
  title: "Kerala Tour Packages | Travel Qila",
  description: "Explore Kerala holiday ideas and request a customised itinerary with Travel Qila.",
  alternates: { canonical: "/destinations/kerala-tour-packages.html" }
};
export default function Page(){return <DestinationPage destination={destinationBySlug["kerala"]}/>;}
