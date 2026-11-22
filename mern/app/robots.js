const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://travelqila.com";

export default function robots() {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/dashboard.html", "/api/"] }
    ],
    sitemap: new URL("/sitemap.xml",siteUrl).toString(),
    host: siteUrl
  };
}
