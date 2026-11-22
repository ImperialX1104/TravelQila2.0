import Link from "next/link";
import Image from "next/image";

export const metadata = { title: "Tour Packages, Flights, Hotels & Visa Assistance", description: "Discover destinations, explore holiday packages and request flight, hotel and visa assistance with Travel Qila.", alternates: { canonical: "/" } };\n\nconst services = [
  { number: "01", title: "Flights", copy: "Share your route, dates and preferences. Our team will help you explore suitable flight options.", href: "/services.html", action: "Explore flights" },
  { number: "02", title: "Hotels", copy: "Find a stay that fits your destination, travel dates, group and budget.", href: "/hotels.html", action: "Explore hotels" },
  { number: "03", title: "Visa assistance", copy: "Understand the documents and next steps for your intended destination.", href: "/visa.html", action: "Explore visa help" },
  { number: "04", title: "Holiday packages", copy: "Explore curated travel ideas or request a personalised itinerary.", href: "/packages.html", action: "Explore packages" }
];

const destinations = [
  ["Thailand", "/destinations/thailand-tour-packages.html", "Beaches, culture and city breaks"],
  ["Vietnam", "/destinations/vietnam-tour-packages.html", "Coastal escapes and memorable stays"],
  ["Dubai", "/destinations/dubai-tour-packages.html", "A vibrant city and desert experience"],
  ["Bali", "/destinations/bali-tour-packages.html", "Island landscapes and slow travel"],
  ["Kashmir", "/destinations/kashmir-tour-packages.html", "Mountains, lakes and scenic retreats"],
  ["Kerala", "/destinations/kerala-tour-packages.html", "Backwaters, nature and wellness"]
];

export default function HomePage() {
  return (
    <main>
      <section className="hero">
        <div className="hero-orbit hero-orbit-one" aria-hidden="true"></div>
        <div className="hero-orbit hero-orbit-two" aria-hidden="true"></div>
        <div className="container hero-content">
          <p className="eyebrow">Your journey, thoughtfully planned</p>
          <h1>Travel farther.<br /><em>Feel more.</em></h1>
          <p className="hero-copy">Discover destinations, compare travel options and create a holiday that feels like yours with Travel Qila.</p>
          <div className="hero-actions">
            <Link className="button" href="/trip-enquiry.html">Plan your journey <span aria-hidden="true">↗</span></Link>
            <Link className="button button-ghost" href="/packages.html">Explore packages</Link>
          </div>
          <div className="hero-proof"><span className="proof-dot"></span> Personalised travel assistance from enquiry to itinerary</div>
        </div>
        <div className="hero-side-note" aria-hidden="true">DISCOVER · EXPERIENCE · REMEMBER</div>
      </section>

      <section className="intro-section section-space">
        <div className="container intro-grid">
          <div>
            <p className="eyebrow eyebrow-blue">Explore the world</p>
            <h2>Find your perfect <em>holiday.</em></h2>
          </div>
          <div className="intro-copy">
            <p>From flight and hotel enquiries to visa guidance and complete holiday packages, bring your travel plans together in one place.</p>
            <Link className="text-link" href="/trip-enquiry.html">Tell us where you want to go <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      </section>

      <section className="services-section section-space">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow eyebrow-blue">Travel made simpler</p><h2>Everything for your <em>next journey.</em></h2></div>
            <p>Choose the service you need. We’ll help you take the next step with clear information and personal support.</p>
          </div>
          <div className="service-grid">
            {services.map(service => (
              <article className="service-card" key={service.number}>
                <span className="service-number">{service.number}</span>
                <div><h3>{service.title}</h3><p>{service.copy}</p></div>
                <Link href={service.href}>{service.action} <span aria-hidden="true">↗</span></Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="destinations-section section-space">
        <div className="container">
          <div className="section-heading">
            <div><p className="eyebrow eyebrow-blue">A little inspiration</p><h2>Where will your next<br /><em>journey take you?</em></h2></div>
            <Link className="text-link" href="/packages.html">View all destinations <span aria-hidden="true">→</span></Link>
          </div>
          <div className="destination-grid">
            {destinations.map(([name, href, copy], index) => (
              <Link className="destination-card" href={href} key={name}>
                <span className="destination-index">0{index + 1}</span>
                <span><strong>{name}</strong><small>{copy}</small></span>
                <span className="destination-arrow" aria-hidden="true">↗</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-cta">
        <div className="container closing-inner">
          <div><p className="eyebrow">Make it a journey to remember</p><h2>Your next chapter<br /><em>starts somewhere.</em></h2></div>
          <Link className="button button-light" href="/trip-enquiry.html">Start planning <span aria-hidden="true">↗</span></Link>
        </div>
      </section>
    </main>
  );
}
