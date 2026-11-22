import ServiceEnquiryForm from "@/components/service-enquiry-form";
import "../service-enquiry.css";
export const metadata = {
  title: "Visa Assistance | Tourist, Business & Travel Visas",
  description: "Get help understanding visa requirements and preparing your application. Share your destination, travel purpose and dates for personalised visa assistance.",
  alternates: { canonical: "/visa.html" }
};
export default function VisaPage() { return <main className="service-enquiry-page visa-enquiry-page"><section className="service-enquiry-hero"><div className="container"><p className="eyebrow">Travel Qila · Visa assistance</p><h1>Your visa journey,<br/><em>guided.</em></h1><p>Clear next steps, practical document guidance and personal assistance for your travel plans.</p></div></section><div className="container enquiry-overlap"><ServiceEnquiryForm type="visa"/></div></main>; }
