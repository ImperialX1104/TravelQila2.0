import DestinationPage from "@/components/destination-page";
import {destinationBySlug} from "@/lib/destination-data";
import "../../destinations.css";
export const metadata = {
  title: "Dubai Tour Packages | Travel Qila",
  description: "Explore Dubai holiday ideas and request a customised itinerary with Travel Qila.",
  alternates: { canonical: "/destinations/dubai-tour-packages.html" }
};
export default function Page(){return <DestinationPage destination={destinationBySlug["dubai"]}/>;}
