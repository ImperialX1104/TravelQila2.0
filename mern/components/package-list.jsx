"use client";
import { useMemo,useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { packages } from "@/lib/package-data";

export default function PackageList(){
 const [search,setSearch]=useState("");const [destination,setDestination]=useState("all");const [duration,setDuration]=useState("all");
 const filtered=useMemo(()=>packages.filter(item=>{
  const q=search.trim().toLowerCase();
  return (!q||(item.name+" "+item.destination+" "+item.description).toLowerCase().includes(q))&&(destination==="all"||item.category===destination)&&(duration==="all"||(duration==="short"&&item.days<=5)||(duration==="medium"&&item.days>=6&&item.days<=7)||(duration==="long"&&item.days>=8));
 }),[search,destination,duration]);
 function reset(){setSearch("");setDestination("all");setDuration("all");}
 return <div className="package-listing container">
  <div className="package-filter-panel"><label>Search packages<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search destination or package"/></label><label>Destination type<select value={destination} onChange={e=>setDestination(e.target.value)}><option value="all">All destinations</option><option value="Domestic">India</option><option value="International">International</option></select></label><label>Duration<select value={duration} onChange={e=>setDuration(e.target.value)}><option value="all">Any duration</option><option value="short">Up to 5 days</option><option value="medium">6–7 days</option><option value="long">8+ days</option></select></label><button type="button" onClick={reset}>Reset filters</button></div>
  <p className="package-result-count">{filtered.length} sample package{filtered.length===1?"":"s"} found</p>
  {filtered.length?<div className="package-grid">{filtered.map(item=><article className="package-card" key={item.id}><Link className="package-image" href={`/package-details.html?id=${item.id}`}><Image src={item.image} alt={item.name} fill sizes="(max-width: 700px) 100vw, 360px"/><span>{item.category} · Sample package</span></Link><div className="package-card-body"><small>{item.destination}</small><h2>{item.name}</h2><p>{item.description}</p><div className="package-card-meta"><span>{item.duration}</span><strong>{item.price}* <small>illustrative / person</small></strong></div><Link className="button" href={`/package-details.html?id=${item.id}`}>Explore package ↗</Link></div></article>)}</div>:<div className="package-empty"><h2>No packages match your filters</h2><p>Try another destination or reset your search.</p><button onClick={reset}>Clear filters</button></div>}
  <p className="package-disclaimer">*Illustrative starting prices are planning examples only, not live offers or confirmed quotes. Final inclusions, availability, taxes and pricing will be provided in a written quotation.</p>
 </div>;
}
