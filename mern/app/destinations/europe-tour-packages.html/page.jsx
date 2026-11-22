import DestinationPage from "@/components/destination-page";
import {destinationBySlug} from "@/lib/destination-data";
import "../../destinations.css";
export const metadata = {
  title: "Europe Tour Packages | Travel Qila",
  description: "Explore Europe holiday ideas and request a customised itinerary with Travel Qila.",
  alternates: { canonical: "/destinations/europe-tour-packages.html" }
};
export default function Page(){return <DestinationPage destination={destinationBySlug["europe"]}/>;}
