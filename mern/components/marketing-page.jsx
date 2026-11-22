import Image from "next/image";
import Link from "next/link";

const blogCards=[
 {title:"Planning your first international holiday",copy:"A practical starting point for choosing dates, destinations and the details to confirm before you travel.",image:"/img/blog-1.jpg"},
 {title:"How to build a balanced travel itinerary",copy:"Make room for the places you want to see while keeping transfer times and downtime realistic.",image:"/img/blog-2.jpg"},
 {title:"Choosing the right stay for your trip",copy:"Compare location, room needs, meal plans and the details that can change the overall travel experience.",image:"/img/blog-3.jpg"}
];
const guideCards=[
 {title:"Plan your travel documents",copy:"Check passport validity, entry rules and transit requirements with official sources before departure.",image:"/img/guide-1.jpg"},
 {title:"Build a realistic itinerary",copy:"Group nearby attractions, allow time for transfers and keep some flexibility in your travel plan.",image:"/img/guide-2.jpg"},
 {title:"Compare accommodation options",copy:"Review location, room occupancy, meal plans, taxes and cancellation conditions before confirming.",image:"/img/guide-3.jpg"},
 {title:"Prepare for your departure",copy:"Recheck tickets, hotel confirmations, local transport and any destination-specific requirements.",image:"/img/guide-4.jpg"}
];
const stories=[
 {name:"Traveller story",text:"A good trip starts with clear communication, realistic expectations and a plan that reflects the traveller's priorities."},
 {name:"Family holiday",text:"Thoughtful pacing and clear details help families make the most of their time away."},
 {name:"Couple getaway",text:"A memorable escape can be built around the experiences, pace and comfort that matter most."},
 {name:"Group travel",text:"Coordinating dates, preferences and practical details makes group travel easier to plan."}
];

export default function MarketingPage({type}){
 const config={
  about:{eyebrow:"About us",title:"Let's explore the world together.",intro:"Travel Qila supports trip planning for travellers exploring destinations in India and overseas.",sub:"From choosing destinations to coordinating travel arrangements, we help make planning clearer. Our approach starts with understanding your travel dates, group size, interests and budget.",image:"/img/about-img.jpg"},
  blog:{eyebrow:"Our blog",title:"Popular travel blogs",intro:"Destination ideas and practical travel planning notes to help you make informed choices.",sub:"Explore inspiration for your next journey, then speak with our team about a trip shaped around your plans.",image:"/img/blog-1.jpg"},
  gallery:{eyebrow:"Our gallery",title:"Tourism & travelling gallery",intro:"A little inspiration for the places, landscapes and experiences that make travel memorable.",sub:"Browse destination imagery and use it as a starting point for your own travel ideas.",image:"/img/gallery-1.jpg"},
  guides:{eyebrow:"Travel guides",title:"Plan with useful travel guidance",intro:"Simple planning reminders for documents, itineraries, accommodation and departure preparation.",sub:"Requirements vary by destination and traveller. Confirm important information with official authorities and your travel providers.",image:"/img/guide-1.jpg"},
  testimonial:{eyebrow:"Traveller stories",title:"Travel experiences matter",intro:"Good travel support starts with listening, clear information and realistic expectations.",sub:"These are illustrative story themes, not verified customer reviews or endorsements.",image:"/img/testimonial-1.jpg"}
 }[type];
 const cards=type==="blog"?blogCards:type==="guides"?guideCards:stories;
 return <main className="marketing-page">
  <section className="marketing-hero"><div className="container marketing-hero-grid"><div><p className="eyebrow">{config.eyebrow}</p><h1>{config.title}</h1><p>{config.intro}</p><Link className="button" href="/trip-enquiry.html">Plan your journey ↗</Link></div><div className="marketing-hero-image"><Image src={config.image} alt="Travel Qila travel inspiration" fill sizes="(max-width:760px) 100vw, 45vw"/></div></div></section>
  {type==="about"&&<section className="container marketing-intro"><div><p className="eyebrow eyebrow-blue">Welcome to Travel Qila</p><h2>Travel planning that starts with <em>you.</em></h2></div><div><p>{config.sub}</p><p>Tell us what kind of holiday you have in mind and our team can discuss the next steps, including destinations, travel dates, accommodation preferences and a clear quotation.</p><div className="marketing-stat-grid"><div><strong>India</strong><span>Domestic travel ideas</span></div><div><strong>Worldwide</strong><span>International destinations</span></div><div><strong>Personal</strong><span>Enquiry-led assistance</span></div></div></div></section>}
  {type==="gallery"&&<section className="container gallery-section"><div className="marketing-section-heading"><p className="eyebrow eyebrow-blue">Travel inspiration</p><h2>Explore places through <em>pictures.</em></h2></div><div className="gallery-grid">{Array.from({length:12},(_,i)=><div className={`gallery-tile gallery-tile-${i%4}`} key={i}><Image src={`/img/gallery-${i+1}.jpg`} alt={`Travel destination gallery ${i+1}`} fill sizes="(max-width:600px) 100vw, 33vw"/></div>)}</div></section>}
  {(type==="blog"||type==="guides"||type==="testimonial")&&<section className="container marketing-card-section"><div className="marketing-section-heading"><p className="eyebrow eyebrow-blue">{type==="blog"?"Travel inspiration":type==="guides"?"Useful planning notes":"Our approach"}</p><h2>{type==="testimonial"?"Every journey has its own story.":"Ideas for your next journey."}</h2></div><div className="marketing-card-grid">{cards.map((card,index)=><article className="marketing-card" key={card.title}><div className="marketing-card-image"><Image src={card.image||`/img/testimonial-${index+1}.jpg`} alt={card.title} fill sizes="(max-width:700px) 100vw, 360px"/></div><div><small>{type==="testimonial"?"Illustrative story":type==="guides"?"Travel guide":"Travel notes"}</small><h2>{card.title||card.name}</h2><p>{card.copy||card.text}</p>{type!=="testimonial"&&<Link href="/trip-enquiry.html">Plan with Travel Qila ↗</Link>}</div></article>)}</div></section>}
  <section className="marketing-cta"><div className="container"><div><p className="eyebrow">Start planning</p><h2>Your next journey<br/><em>starts somewhere.</em></h2></div><Link className="button button-light" href="/trip-enquiry.html">Tell us about your trip ↗</Link></div></section>
 </main>;
}
