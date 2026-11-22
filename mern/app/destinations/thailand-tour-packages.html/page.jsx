import DestinationPage from "@/components/destination-page";
import {destinationBySlug} from "@/lib/destination-data";
import "../../destinations.css";
export const metadata = {
  title: "Thailand Tour Packages | Travel Qila",
  description: "Explore Thailand holiday ideas and request a customised itinerary with Travel Qila.",
  alternates: { canonical: "/destinations/thailand-tour-packages.html" }
};
export default function Page(){return <DestinationPage destination={destinationBySlug["thailand"]}/>;}
