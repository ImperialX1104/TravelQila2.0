import Link from "next/link";
import "../not-found.css";

export const metadata = { title: "Page Not Found", robots: { index: false, follow: false } };

export default function CustomNotFoundPage() {
  return <main className="not-found"><div className="container"><p className="eyebrow eyebrow-blue">404 · Page not found</p><h1>This page took<br/><em>a wrong turn.</em></h1><p>We’re sorry, the page you have looked for does not exist. You can return to the homepage or explore our travel services.</p><div><Link className="button" href="/">Back to home ↗</Link><Link className="button button-outline" href="/packages.html">Explore packages</Link></div></div></main>;
}
