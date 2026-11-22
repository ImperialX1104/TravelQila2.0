import Link from "next/link";

const footerGroups = [
  { title: "Company", links: [["About us", "/about.html"], ["Our packages", "/packages.html"], ["Travel blog", "/blog.html"], ["Contact", "/contact.html"]] },
  { title: "Travel services", links: [["Flights", "/services.html"], ["Hotels", "/hotels.html"], ["Visa assistance", "/visa.html"], ["Plan your trip", "/trip-enquiry.html"]] },
  { title: "Support", links: [["FAQs & enquiries", "/contact.html"], ["Privacy policy", "/privacy.html"], ["Terms & conditions", "/terms.html"]] }
];

export default function SiteFooter() {
  return (
    <footer className="site-footer footer">
      <div className="container footer-grid">
        <div className="footer-about">
          <Link className="brand brand-light" href="/">
            <span className="brand-mark">TQ</span>
            <span>Travel Qila<small>Explore the world</small></span>
          </Link>
          <p>Thoughtful travel planning, personalised options and support for journeys near and far.</p>
          <a href="mailto:info@travelqila.com">info@travelqila.com</a>
          <a href="tel:+919871101345">+91 98711 01345</a>
        </div>
        {footerGroups.map(group => (
          <div className="footer-group" key={group.title}>
            <h2>{group.title}</h2>
            {group.links.map(([label, href]) => <Link key={href + label} href={href}>{label}</Link>)}
          </div>
        ))}
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Travel Qila. All rights reserved.</span>
        <span>Travel planning made personal.</span>
      </div>
    </footer>
  );
}
