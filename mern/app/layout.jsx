import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://travelqila.com";
const travelAgencySchema = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "Travel Qila",
  url: siteUrl,
  description: "Travel planning, flight and hotel booking assistance, holiday packages and visa guidance."
};

export const metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Travel Qila | Tour Packages, Flights, Hotels & Visa Assistance",
    template: "%s | Travel Qila"
  },
  description: "Discover memorable holidays, compare travel options and plan your next journey with Travel Qila.",
  applicationName: "Travel Qila",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  twitter: {
    card: "summary_large_image",
    title: "Travel Qila | Explore the World",
    description: "Plan memorable holidays with Travel Qila."
  },
  openGraph: {
    type: "website",
    siteName: "Travel Qila",
    title: "Travel Qila | Explore the World",
    description: "Plan memorable holidays with Travel Qila."
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(travelAgencySchema) }} />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
