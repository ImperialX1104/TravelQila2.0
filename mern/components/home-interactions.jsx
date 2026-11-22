"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";

const slides = [
  { image:"/img/carousel-1.jpg", eyebrow:"Travel Qila · Explore the world", title:"Find Your Perfect Holiday", subtitle:"Discover remarkable destinations, thoughtful itineraries and memorable experiences with Travel Qila.", action:"Explore Tours" },
  { image:"/img/carousel-3.jpg", eyebrow:"Your next journey starts here", title:"Where Will Your Next Journey Take You?", subtitle:"From relaxing escapes to unforgettable adventures, let us help plan your next trip.", action:"Plan Your Trip" }
];

export function HeroCarousel() {
  const [active,setActive] = useState(0);
  useEffect(()=>{
    const timer=window.setInterval(()=>setActive(current=>(current+1)%slides.length),6500);
    return ()=>window.clearInterval(timer);
  },[]);
  const slide=slides[active];
  return <section className="home-carousel" style={{backgroundImage:`linear-gradient(90deg,rgba(8,19,39,.68),rgba(8,19,39,.2)),url("${slide.image}")`}} aria-label="Travel Qila featured destinations">
    <div className="home-carousel-content">
      <p className="home-carousel-eyebrow">{slide.eyebrow}</p>
      <h1>{slide.title}</h1>
      <p className="home-carousel-subtitle">{slide.subtitle}</p>
      <Link className="home-primary-button" href={active===0?"/packages.html":"/trip-enquiry.html"}>{slide.action}</Link>
    </div>
    <button className="home-carousel-arrow previous" type="button" aria-label="Previous slide" onClick={()=>setActive(current=>(current+slides.length-1)%slides.length)}><ChevronLeft/></button>
    <button className="home-carousel-arrow next" type="button" aria-label="Next slide" onClick={()=>setActive(current=>(current+1)%slides.length)}><ChevronRight/></button>
    <div className="home-carousel-dots">{slides.map((item,index)=><button key={item.title} type="button" aria-label={`Show slide ${index+1}`} aria-current={active===index?"true":undefined} className={active===index?"active":""} onClick={()=>setActive(index)}/>)}</div>
  </section>;
}

export function HomeSearch() {
  const [query,setQuery]=useState("");
  const router=useRouter();
  function submit(event) {
    event.preventDefault();
    const value=query.trim();
    router.push(value?"/packages.html?search="+encodeURIComponent(value):"/packages.html");
  }
  return <form className="home-search-bar" onSubmit={submit}>
    <label htmlFor="homeDestination">Where would you like to go?</label>
    <div className="home-search-input"><Search size={18}/><input id="homeDestination" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Eg: Thailand, Bali, Dubai" maxLength={80}/></div>
    <button className="home-primary-button" type="submit">Search</button>
  </form>;
}

const destinationCards = [
  {name:"New York City",region:"USA",image:"destination-1.jpg",place:"New York City"},
  {name:"Las Vegas",region:"USA",image:"destination-2.jpg",place:"Las Vegas"},
  {name:"Los Angeles",region:"USA",image:"destination-3.jpg",place:"Los Angeles"},
  {name:"San Francisco",region:"USA",image:"destination-4.jpg",place:"San Francisco"},
  {name:"Toronto",region:"Canada",image:"destination-5.jpg",place:"Toronto"},
  {name:"Vancouver",region:"Canada",image:"destination-6.jpg",place:"Vancouver"},
  {name:"Paris",region:"Europe",image:"destination-7.jpg",place:"Paris"},
  {name:"Beijing",region:"China",image:"destination-8.jpg",place:"Beijing"},
  {name:"Singapore",region:"Singapore",image:"destination-9.jpg",place:"Singapore"}
];

export function DestinationTabs() {
  const [filter,setFilter]=useState("All");
  const filters=["All","USA","Canada","Europe","China","Singapore"];
  const visible=filter==="All"?destinationCards:destinationCards.filter(item=>item.region===filter);
  return <>
    <div className="home-filter-tabs" role="group" aria-label="Filter destinations">
      {filters.map(item=><button key={item} type="button" className={filter===item?"active":""} aria-pressed={filter===item} onClick={()=>setFilter(item)}>{item}</button>)}
    </div>
    <div className="home-destination-grid">{visible.map(item=><Link className="home-destination-card" href={"/trip-enquiry.html?destination="+encodeURIComponent(item.place)} key={item.name}>
      <img src={"/img/"+item.image} alt={item.name} loading="lazy"/><span className="home-destination-overlay"><strong>{item.name}</strong><small>{item.region}</small></span>
    </Link>)}</div>
  </>;
}

const tourCards = {
  National: [
    {name:"Kashmir Escape",place:"Kashmir",image:"explore-tour-1.jpg",id:"kashmir-escape"},
    {name:"Kerala Backwaters",place:"Kerala",image:"explore-tour-2.jpg",id:"kerala-backwaters"},
    {name:"Goa Beach Holiday",place:"Goa",image:"explore-tour-3.jpg",id:"goa-beach"}
  ],
  International: [
    {name:"Bali Discovery",place:"Indonesia",image:"explore-tour-4.jpg",id:"bali-discovery"},
    {name:"Dubai Highlights",place:"United Arab Emirates",image:"explore-tour-5.jpg",id:"dubai-highlights"},
    {name:"Thailand Explorer",place:"Thailand",image:"explore-tour-6.jpg",id:"thailand-explorer"}
  ]
};

export function ExploreTourTabs() {
  const [tab,setTab]=useState("National");
  return <>
    <div className="home-tour-tabs" role="group" aria-label="Tour categories">
      <button type="button" className={tab==="National"?"active":""} aria-pressed={tab==="National"} onClick={()=>setTab("National")}>National Tour Category</button>
      <button type="button" className={tab==="International"?"active":""} aria-pressed={tab==="International"} onClick={()=>setTab("International")}>International Tour Category</button>
    </div>
    <div className="home-tour-grid">{tourCards[tab].map(item=><Link className="home-tour-card" href={item.id==="goa-beach"?"/trip-enquiry.html?destination=Goa":"/package-details.html?id="+item.id} key={item.id}>
      <img src={"/img/"+item.image} alt={item.name} loading="lazy"/><span className="home-tour-shade"/><span className="home-tour-caption"><small>{item.place}</small><strong>{item.name}</strong><em>Explore tour ↗</em></span>
    </Link>)}</div>
  </>;
}

export function BookingPromo() {
  const [status,setStatus]=useState("");
  function submit(event) {
    event.preventDefault();
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const values=new FormData(form);
    const message=[
      "Hello Travel Qila, I would like to enquire about a holiday.",
      "Name: "+values.get("name"),"Email: "+values.get("email"),
      "Travel date: "+values.get("date"),"Destination: "+values.get("destination"),
      "Travellers: "+values.get("travellers"),"Special request: "+(values.get("request")||"None")
    ].join("\n");
    const subject="Travel Qila - holiday booking enquiry";
    const submitter=event.nativeEvent.submitter?.value;
    if(submitter==="email"){
      window.open("mailto:info@travelqila.com?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(message),"_self");
      setStatus("Your email app should open with the enquiry pre-filled. Please press Send to submit it.");
    }else{
      window.open("https://wa.me/919871101345?text="+encodeURIComponent(message),"_blank","noopener,noreferrer");
      setStatus("WhatsApp should open with the enquiry pre-filled. Please press Send to submit it.");
    }
  }
  return <div className="home-booking-layout">
    <div className="home-booking-copy"><p className="home-section-eyebrow">Online Booking</p><h2>Book Your Next<br/><em>Adventure.</em></h2><p>Tell us where you want to go and what matters most. Our travel team will help you shape the right itinerary.</p>
      <ul><li>Personalised travel planning</li><li>Flight and hotel assistance</li><li>Holiday packages and visa guidance</li></ul>
      <Link href="/packages.html" className="home-primary-button">Explore Packages</Link>
    </div>
    <form className="home-booking-form" onSubmit={submit}>
      <p className="home-section-eyebrow">Start planning today</p><h3>Book A Tour Deals</h3><p>Share your travel details and we will get back to you.</p>
      <div className="home-booking-fields">
        <label>Your name *<input name="name" required maxLength={100} placeholder="Full name"/></label>
        <label>Email address *<input name="email" type="email" required maxLength={150} placeholder="Email address"/></label>
        <label>Travel date *<input name="date" type="date" min={new Intl.DateTimeFormat("en-CA",{timeZone:"Asia/Kolkata"}).format(new Date())} required/></label>
        <label>Destination *<input name="destination" required maxLength={100} placeholder="Where would you like to go?"/></label>
        <label>Travellers *<select name="travellers" defaultValue="2"><option value="1">1 traveller</option><option value="2">2 travellers</option><option value="3">3 travellers</option><option value="4">4 travellers</option><option value="5+">5+ travellers</option></select></label>
        <label className="home-booking-wide">Special request<textarea name="request" rows="2" maxLength={800} placeholder="Tell us about your plans"/></label>
      </div>
      <div className="home-booking-actions"><button className="home-primary-button" type="submit" value="whatsapp">Send via WhatsApp</button><button className="home-secondary-button" type="submit" value="email">Send by email</button></div>
      {status&&<p className="home-form-status" role="status">{status}</p>}
    </form>
  </div>;
}

export function NewsletterForm() {
  const [email,setEmail]=useState("");
  const [status,setStatus]=useState("");
  function submit(event){
    event.preventDefault();
    const value=email.trim();
    if(!value)return;
    window.open("mailto:info@travelqila.com?subject="+encodeURIComponent("Travel Qila newsletter subscription")+"&body="+encodeURIComponent("Please add this email address to the Travel Qila newsletter: "+value),"_self");
    setStatus("Your email app should open with the subscription request pre-filled.");
  }
  return <form className="home-newsletter-form" onSubmit={submit}>
    <label className="sr-only" htmlFor="newsletterEmail">Email address</label>
    <input id="newsletterEmail" type="email" required maxLength={150} value={email} onChange={event=>setEmail(event.target.value)} placeholder="Enter your email address"/>
    <button type="submit">Subscribe</button>
    {status&&<span role="status">{status}</span>}
  </form>;
}
