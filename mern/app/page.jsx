import Image from "next/image";
import Link from "next/link";
import { packages } from "@/lib/package-data";
import GalleryGrid from "@/components/gallery-grid";
import { HeroCarousel, HomeSearch, DestinationTabs, ExploreTourTabs, BookingPromo, NewsletterForm } from "@/components/home-interactions";
import "./home-replica.css";
import "./marketing.css";

export const metadata = {
  title: "Tour Packages, Flights, Hotels & Visa Assistance",
  description: "Discover destinations, explore holiday packages and request flight, hotel and visa assistance with Travel Qila.",
  alternates: { canonical: "/" }
};

const guides = [
  {name:"Travel Specialist",role:"Holiday Planning",image:"guide-1.jpg"},
  {name:"Destination Expert",role:"International Tours",image:"guide-2.jpg"},
  {name:"Travel Consultant",role:"Family Holidays",image:"guide-3.jpg"},
  {name:"Trip Planner",role:"Custom Itineraries",image:"guide-4.jpg"}
];
const blogs = [
  {title:"How to Plan a Memorable Holiday",category:"Travel Tips",image:"blog-1.jpg",description:"A few thoughtful choices can make your next holiday smoother, richer and more memorable."},
  {title:"Discover New Places and Experiences",category:"Destination Guide",image:"blog-2.jpg",description:"Explore local experiences, culture and places worth adding to your travel plans."},
  {title:"Make Every Journey Count",category:"Travel Inspiration",image:"blog-3.jpg",description:"Simple planning ideas to help you make the most of every day away."}
];
const stories = [
  {quote:"The team helped us organise the details of our holiday and made the planning process feel straightforward.",name:"Travel Qila Customer",trip:"Family holiday"},
  {quote:"We appreciated having one point of contact for our hotel options, itinerary and travel questions.",name:"Travel Qila Customer",trip:"International trip"},
  {quote:"The itinerary was shaped around our dates and preferences. Communication was clear throughout.",name:"Travel Qila Customer",trip:"Couple getaway"},
  {quote:"A helpful team when we needed advice and a little extra guidance before travelling.",name:"Travel Qila Customer",trip:"Custom holiday"}
];
const domestic = ["Goa","Kashmir","Kerala","Rajasthan","Himachal Pradesh","Andaman"];
const international = ["Bali","Dubai","Thailand","Singapore","Maldives","Vietnam"];

export default function HomePage() {
  return <main className="home-main">
    <HeroCarousel/>
    <div className="home-search-container"><HomeSearch/></div>

    <section className="home-section home-about" id="about">
      <div className="home-about-image"><Image src="/img/about-img.jpg" alt="Travel experiences and destinations" width={720} height={520} priority/></div>
      <div className="home-about-copy">
        <p className="home-section-eyebrow">About Travel Qila</p>
        <h2>Welcome to <em>Travel Qila</em></h2>
        <p>Travel is about the experiences, people and memories you bring home. At Travel Qila, we help you plan journeys that fit your interests, dates and budget.</p>
        <p>From holiday packages and flight options to hotel assistance and visa guidance, our team brings the details together so you can focus on the journey ahead.</p>
        <ul><li>Personalised holiday planning</li><li>Domestic and international trips</li><li>Flight and hotel assistance</li><li>Visa guidance and support</li></ul>
        <Link className="home-primary-button" href="/about.html">Read More</Link>
      </div>
    </section>

    <section className="home-section" id="popular-destinations">
      <div className="home-section-heading"><p className="home-section-eyebrow">Popular Destination</p><h2>Choose Your Next <em>Destination</em></h2><p>Explore inspiring places and find a destination that suits your style of travel.</p></div>
      <DestinationTabs/>
    </section>

    <section className="home-tour-section">
      <div className="home-section">
        <div className="home-section-heading"><p className="home-section-eyebrow">Explore Tour</p><h2>Explore The <em>World</em></h2><p>Find a little inspiration for your next domestic or international escape.</p></div>
        <ExploreTourTabs/>
      </div>
    </section>

    <section className="home-section" id="featured-packages">
      <div className="home-section-heading"><p className="home-section-eyebrow">Awesome Packages</p><h2>Our Popular <em>Packages</em></h2><p>Discover a few of the journeys you can start planning with Travel Qila.</p></div>
      <div className="home-package-grid">{packages.slice(0,4).map(item=><article className="home-package-card" key={item.id}>
        <Link href={"/package-details.html?id="+encodeURIComponent(item.id)}><Image src={item.image} alt={item.name} width={520} height={340}/></Link>
        <div className="home-package-card-body"><small>{item.destination}</small><h3>{item.name}</h3><p>{item.duration} · Tailored travel planning</p><div className="home-package-card-footer"><strong>{item.price}</strong><Link href={"/package-details.html?id="+encodeURIComponent(item.id)}>View details ↗</Link></div></div>
      </article>)}</div>
      <div className="home-gallery-link"><Link href="/packages.html" className="home-primary-button">View All Packages</Link></div>
    </section>

    <section className="home-gallery-section">
      <div className="home-section">
        <div className="home-section-heading"><p className="home-section-eyebrow">Travel Memories</p><h2>Tourism &amp; Traveling <em>Gallery</em></h2><p>A little inspiration from the places and experiences waiting to be discovered.</p></div>
        <GalleryGrid/>
        <div className="home-gallery-link"><Link href="/gallery.html" className="home-primary-button">View Full Gallery</Link></div>
      </div>
    </section>

    <section className="home-booking-section"><BookingPromo/></section>

    <section className="home-section" id="travel-guides">
      <div className="home-section-heading"><p className="home-section-eyebrow">Meet Our Guide</p><h2>Meet Our Travel <em>Specialists</em></h2><p>Connect with a team that can help you plan the details of your next journey.</p></div>
      <div className="home-guide-grid">{guides.map(guide=><article className="home-guide-card" key={guide.image}><Image src={"/img/"+guide.image} alt={guide.role} width={440} height={340}/><div><h3>{guide.name}</h3><p>{guide.role}</p></div></article>)}</div>
    </section>

    <section className="home-tour-section">
      <div className="home-section" id="travel-blogs">
        <div className="home-section-heading"><p className="home-section-eyebrow">Travel Inspiration</p><h2>Popular Travel <em>Blogs</em></h2><p>Read ideas and useful notes to help you plan a better trip.</p></div>
        <div className="home-blog-grid">{blogs.map(blog=><article className="home-blog-card" key={blog.image}><Link href="/blog.html"><Image src={"/img/"+blog.image} alt={blog.title} width={520} height={340}/></Link><div><small>{blog.category}</small><h3>{blog.title}</h3><p>{blog.description}</p><Link href="/blog.html">Read more ↗</Link></div></article>)}</div>
      </div>
    </section>

    <section className="home-testimonials-section">
      <div className="home-section">
        <div className="home-section-heading"><p className="home-section-eyebrow">Customer Experiences</p><h2>Travel Stories &amp; <em>Experiences</em></h2><p>We value the trust travellers place in our team when planning their journeys.</p></div>
        <div className="home-testimonial-grid">{stories.map((story,index)=><article className="home-testimonial-card" key={index}><span className="quote-mark" aria-hidden="true">“</span><p>{story.quote}</p><strong>{story.name}</strong><small>{story.trip}</small></article>)}</div>
      </div>
    </section>

    <section className="home-section" id="popular-travel-destinations">
      <div className="home-section-heading"><p className="home-section-eyebrow">Find Your Next Escape</p><h2>Popular Domestic &amp; International <em>Destinations</em></h2><p>Browse destination ideas and ask our team to help you shape an itinerary.</p></div>
      <div className="home-seo-links">
        <div><h3>Domestic Destinations</h3><ul>{domestic.map(place=><li key={place}><Link href={"/trip-enquiry.html?destination="+encodeURIComponent(place)}>{place} Tour Packages</Link></li>)}</ul></div>
        <div><h3>International Destinations</h3><ul>{international.map(place=><li key={place}><Link href={"/trip-enquiry.html?destination="+encodeURIComponent(place)}>{place} Tour Packages</Link></li>)}</ul></div>
      </div>
    </section>

    <section className="home-newsletter"><h2>Our Newsletter</h2><p>Get travel inspiration and planning ideas delivered to your inbox.</p><NewsletterForm/></section>
  </main>;
}
