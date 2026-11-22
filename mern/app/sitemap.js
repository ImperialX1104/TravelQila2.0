import { packages } from "@/lib/package-data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://travelqila.com";
const publicPaths = [
  "/", "/about.html", "/blog.html", "/contact.html", "/destination.html",
  "/gallery.html", "/guides.html", "/hotels.html", "/packages.html",
  "/privacy.html", "/services.html", "/terms.html", "/testimonial.html",
  "/tour.html", "/trip-enquiry.html", "/visa.html",
  "/destinations/bali-tour-packages.html", "/destinations/dubai-tour-packages.html",
  "/destinations/europe-tour-packages.html", "/destinations/goa-tour-packages.html",
  "/destinations/kashmir-tour-packages.html", "/destinations/kerala-tour-packages.html",
  "/destinations/malaysia-tour-packages.html", "/destinations/maldives-tour-packages.html",
  "/destinations/singapore-tour-packages.html", "/destinations/thailand-tour-packages.html",
  "/destinations/vietnam-tour-packages.html"
];

export default function sitemap() {
  const lastModified = new Date();
  const pages = publicPaths.map(path=>({
    url:new URL(path,siteUrl).toString(),lastModified,changeFrequency:path==="/"? "weekly":"monthly",priority:path==="/"?1:0.7
  }));
  const packagePages = packages.map(item=>({
    url:new URL("/package-details.html?id="+encodeURIComponent(item.id),siteUrl).toString(),
    lastModified,changeFrequency:"monthly",priority:0.75
  }));
  return [...pages,...packagePages];
}
