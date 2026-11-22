import ServiceEnquiryForm from "@/components/service-enquiry-form";
import "../service-enquiry.css";
export const metadata = {
  title: "Plan Your Trip | Request a Holiday Quotation",
  description: "Tell Travel Qila about your destination, dates, group and budget to request a personalised holiday quotation.",
  alternates: { canonical: "/trip-enquiry.html" }
};
export default function TripEnquiryPage() { return <main className="service-enquiry-page trip-enquiry-page"><section className="service-enquiry-hero"><div className="container"><p className="eyebrow">Travel Qila · Custom trip</p><h1>Let's plan something<br/><em>memorable.</em></h1><p>Tell us a little about your trip. Our team will follow up to understand your requirements.</p></div></section><div className="container enquiry-overlap"><ServiceEnquiryForm type="trip"/></div></main>; }
