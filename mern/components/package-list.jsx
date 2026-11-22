"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { packages } from "@/lib/package-data";

export default function PackageList({ initialSearch = "" }) {
  const [search,setSearch] = useState(initialSearch);
  const [destination,setDestination] = useState("all");
  const [duration,setDuration] = useState("all");
  const filtered = useMemo(()=>packages.filter(item=>{
    const query=search.trim().toLowerCase();
    return (!query||(item.name+" "+item.destination+" "+item.description).toLowerCase().includes(query)) &&
      (destination==="all"||item.category===destination) &&
      (duration==="all"||(duration==="short"&&item.days<=5)||(duration==="medium"&&item.days>=6&&item.days<=7)||(duration==="long"&&item.days>=8));
  }),[search,destination,duration]);
  function reset(){setSearch("");setDestination("all");setDuration("all");}

  return <section className="package-listing">
    <div className="package-section-heading">
      <p>FIND YOUR JOURNEY</p>
      <h2>Explore Our Holiday Ideas</h2>
      <span>Search destinations and discover trips that match your interests.</span>
    </div>
    <div className="package-filter-panel">
      <label>Search destination<input id="packageSearch" value={search} onChange={event=>setSearch(event.target.value)} placeholder="e.g. Bali, Kashmir, Dubai" maxLength={80}/></label>
      <label>Destination type<select value={destination} onChange={event=>setDestination(event.target.value)}><option value="all">All destinations</option><option value="Domestic">India</option><option value="International">International</option></select></label>
      <label>Duration<select value={duration} onChange={event=>setDuration(event.target.value)}><option value="all">Any duration</option><option value="short">Up to 5 days</option><option value="medium">6–7 days</option><option value="long">8+ days</option></select></label>
      <button type="button" onClick={reset}>↻ Reset</button>
    </div>
    <div className="package-development-note"><strong>Development preview:</strong> Destinations, durations and indicative prices on this page are sample content for demonstration. They are not live offers, confirmed itineraries or bookable inventory. Actual availability and quotations must be confirmed by Travel Qila.</div>
    <div className="package-list-heading"><h3>Holiday Inspiration</h3><span>Showing {filtered.length} of {packages.length} sample packages</span></div>
    {filtered.length ? <div className="package-grid">{filtered.map(item=><article className="package-card" key={item.id}>
      <Link className="package-image" href={"/package-details.html?id="+encodeURIComponent(item.id)}>
        <Image src={item.image} alt={item.name} fill sizes="(max-width:700px) 100vw, 33vw"/>
        <span>SAMPLE PACKAGE</span>
      </Link>
      <div className="package-card-body">
        <small>{item.category==="Domestic"?"INDIA":"INTERNATIONAL"}</small>
        <h2>{item.name}</h2>
        <p>{item.description}</p>
        <div className="package-card-meta"><span>{item.duration} <small>◆ {item.destination.split(",")[0]}</small></span><strong>{item.price}*<small>Illustrative / person</small></strong></div>
        <Link className="package-explore-link" href={"/package-details.html?id="+encodeURIComponent(item.id)}>Explore</Link>
      </div>
    </article>)}</div> : <div className="package-empty"><h2>No matching packages found</h2><p>Try another destination or reset your filters.</p><button type="button" onClick={reset}>Reset filters</button></div>}
    <p className="package-disclaimer">*All displayed prices are fictional development examples, not supplier quotations. Final prices depend on travel dates, availability, inclusions and supplier confirmation.</p>
    <section className="package-custom-cta"><h2>Can’t Find Your Perfect Holiday?</h2><p>Tell us your destination, travel dates, group size and budget. We’ll help you plan a customised trip.</p><Link href="/trip-enquiry.html">♧ Plan a Custom Trip</Link></section>
  </section>;
}
