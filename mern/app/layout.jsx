import "./globals.css";
import SiteHeader from "@/components/site-header";
import SiteFooter from "@/components/site-footer";

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://travelqila.com"),
  title: {
    default: "Travel Qila | Tour Packages, Flights, Hotels & Visa Assistance",
    template: "%s | Travel Qila"
  },
  description: "Discover memorable holidays, compare travel options and plan your next journey with Travel Qila.",
  applicationName: "Travel Qila",\n  alternates: { canonical: "/" },\n  robots: { index: true, follow: true },\n  twitter: { card: "summary_large_image", title: "Travel Qila | Explore the World", description: "Plan memorable holidays with Travel Qila." },
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
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}
