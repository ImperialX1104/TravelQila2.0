import Link from "next/link";

const navigation = [
  ["Home", "/"],
  ["About", "/about.html"],
  ["Flights", "/services.html"],
  ["Hotels", "/hotels.html"],
  ["Visa", "/visa.html"],
  ["Packages", "/packages.html"],
  ["Blog", "/blog.html"],
  ["Contact", "/contact.html"]
];

export default function SiteHeader() {
  return (
    <>
      <div className="topbar">
        <div className="container topbar-inner">
          <span>Plan your next journey with Travel Qila</span>
          <div className="topbar-links">
            <a href="tel:+919871101345">+91 98711 01345</a>
            <a href="mailto:info@travelqila.com">info@travelqila.com</a>
          </div>
        </div>
      </div>
      <header className="site-header navbar">
        <div className="container nav-inner">
          <Link className="brand" href="/" aria-label="Travel Qila home">
            <span className="brand-mark">TQ</span>
            <span>Travel Qila<small>Explore the world</small></span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            {navigation.map(([label, href]) => (
              <Link key={href} href={href}>{label}</Link>
            ))}
          </nav>
          <div className="nav-actions">
            <Link className="login-link" href="/login.html">Login</Link>
            <Link className="button button-small" href="/trip-enquiry.html">Plan your trip</Link>
          </div>
          <details className="mobile-menu">
            <summary aria-label="Open navigation menu"><span></span><span></span><span></span></summary>
            <nav aria-label="Mobile navigation">
              {navigation.map(([label, href]) => (
                <Link key={href} href={href}>{label}</Link>
              ))}
              <Link href="/login.html">Login</Link>
              <Link href="/trip-enquiry.html">Plan your trip</Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
