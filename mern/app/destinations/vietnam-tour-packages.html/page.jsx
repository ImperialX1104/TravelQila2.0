import DestinationPage from "@/components/destination-page";
import {destinationBySlug} from "@/lib/destination-data";
import "../../destinations.css";
export const metadata = {
  title: "Vietnam Tour Packages | Travel Qila",
  description: "Explore Vietnam holiday ideas and request a customised itinerary with Travel Qila.",
  alternates: { canonical: "/destinations/vietnam-tour-packages.html" }
};
export default function Page(){return <DestinationPage destination={destinationBySlug["vietnam"]}/>;}
