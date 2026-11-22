import ServiceEnquiryForm from "@/components/service-enquiry-form";
import { packageById } from "@/lib/package-data";
import { indiaToday } from "@/lib/date";
import "../service-enquiry.css";
export const metadata = {
  title: "Plan Your Trip | Request a Holiday Quotation",
  description: "Tell Travel Qila about your destination, dates, group and budget to request a personalised holiday quotation.",
  alternates: { canonical: "/trip-enquiry.html" }
};
export default async function TripEnquiryPage({ searchParams }) {
  const params = await searchParams;
  const packageId = typeof params?.package === "string" ? params.package : "";
  const selected = packageById[packageId] || null;
  const destination = typeof params?.destination === "string" ? params.destination : selected?.destination || "";
  const initialPackage = selected ? { id: selected.id, name: selected.name, destination: selected.destination } : null;
  return <main className="service-enquiry-page trip-enquiry-page"><section className="service-enquiry-hero"><div className="container"><p className="eyebrow">Travel Qila · Custom trip</p><h1>Let&apos;s plan something<br/><em>memorable.</em></h1><p>Tell us a little about your trip. Our team will follow up to understand your requirements.</p></div></section><div className="container enquiry-overlap"><ServiceEnquiryForm type="trip" minDate={indiaToday()} initialDestination={destination} initialPackage={initialPackage}/></div></main>;
}
