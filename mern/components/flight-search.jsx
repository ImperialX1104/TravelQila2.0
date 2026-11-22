"use client";

import { useMemo, useState } from "react";
import Link from "next/link";\nimport { useRouter } from "next/navigation";\nimport { parseAirport, buildFlightOptions } from "@/lib/flight-catalog";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const money = value => "₹" + Number(value || 0).toLocaleString("en-IN");
const localDate = offset => { const d=new Date();d.setDate(d.getDate()+offset);d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10); };
const formatDate = value => value ? new Date(value+"T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"}) : "";
const durationText = value => Math.floor(value/60)+"h "+value%60+"m";
export default function FlightSearch({ initialSearch = {}, minDate }) {\n  const router = useRouter();
  const hasInitialSearch = Boolean(initialSearch.origin && initialSearch.destination && initialSearch.departureDate);
  const defaults = {
    tripType: "Round trip", origin: "", destination: "", departureDate: "", returnDate: "",
    cabin: "Economy", adults: "1", children: "0", infants: "0", stops: "Any",
    maximumBudget: "50000", dateFlexibility: "Exact dates", additionalPreferences: ""
  };
  const [form,setForm] = useState(() => ({ ...defaults, ...initialSearch, tripType: initialSearch.tripType || defaults.tripType }));
  const [minDate,setMinDate] = useState("");
  const [stage,setStage] = useState(() => hasInitialSearch ? "outbound" : "form");
  const [outboundOptions,setOutboundOptions] = useState(() => {
    if (!hasInitialSearch) return [];
    const from = parseAirport(initialSearch.origin);
    const to = parseAirport(initialSearch.destination);
    return buildFlightOptions(from,to,initialSearch.departureDate,from.code+to.code,initialSearch.dateFlexibility||"Exact dates");
  });
  const [returnOptions,setReturnOptions] = useState(() => {
    if (!hasInitialSearch || initialSearch.tripType === "One way" || !initialSearch.returnDate) return [];
    const from = parseAirport(initialSearch.destination);
    const to = parseAirport(initialSearch.origin);
    return buildFlightOptions(from,to,initialSearch.returnDate,from.code+to.code,initialSearch.dateFlexibility||"Exact dates");
  });
  const [outbound,setOutbound]=useState(null);
  const [returning,setReturning]=useState(null);
  const [filters,setFilters]=useState({stops:"any",airline:"all",sort:"price"});
  const [message,setMessage]=useState({text:"",kind:"info"});
  const [busy,setBusy]=useState("");
  const [wishlistId,setWishlistId]=useState(initialSearch.wishlistId||null);



  function change(event) { const {name,value}=event.target;setForm(current=>({...current,[name]:value})); }
  function submit(event) {
    event.preventDefault();setMessage({text:"",kind:"info"});
    const origin=parseAirport(form.origin),destination=parseAirport(form.destination);
    if(!origin.city||!destination.city||origin.city.toLowerCase()===destination.city.toLowerCase()||(origin.code&&origin.code===destination.code)){setMessage({text:"Choose two different departure and arrival cities.",kind:"error"});return;}
    if(!form.departureDate||(form.tripType==="Round trip"&&(!form.returnDate||form.returnDate<form.departureDate))){setMessage({text:"Choose valid travel dates. Return date must be on or after departure.",kind:"error"});return;}
    const adults=Number(form.adults),infants=Number(form.infants);
    if(infants>adults){setMessage({text:"Infants cannot exceed the number of adults.",kind:"error"});return;}
    const out=buildFlightOptions(origin,destination,form.departureDate,origin.code+destination.code,form.dateFlexibility);
    const ret=form.tripType==="Round trip"?buildFlightOptions(destination,origin,form.returnDate,destination.code+origin.code,form.dateFlexibility):[];
    setOutboundOptions(out);setReturnOptions(ret);setOutbound(null);setReturning(null);setFilters({stops:"any",airline:"all",sort:"price"});setStage("outbound");
  }

  const passengers=Number(form.adults)+Number(form.children)+Number(form.infants);
  const selectedBase=(outbound?.price||0)+(returning?.price||0);
  const pricing={baseFare:selectedBase*passengers,taxAmount:Math.round(selectedBase*passengers*.05),totalFare:selectedBase*passengers+Math.round(selectedBase*passengers*.05)};
  const trip=outbound?{version:1,origin:outbound.origin,destination:outbound.destination,tripType:form.tripType,departureDate:outbound.departureDate,returnDate:form.tripType==="Round trip"?(returning?.departureDate||form.returnDate):null,stops:form.stops,maximumBudget:Number(form.maximumBudget),dateFlexibility:form.dateFlexibility,searchDepartureDate:form.departureDate,searchReturnDate:form.tripType==="Round trip"?form.returnDate:null,additionalPreferences:form.additionalPreferences,passengers:{adults:Number(form.adults),children:Number(form.children),infants:Number(form.infants)},cabin:form.cabin,outbound,return:returning,pricing,priceSource:"illustrative_demo",savedAt:new Date().toISOString()} : null;

  const activeOptions=stage==="return"?returnOptions:outboundOptions;
  const filtered=useMemo(()=>{
    const preference=form.stops;
    const minReturn=stage==="outbound"&&form.tripType==="Round trip"&&returnOptions.length?Math.min(...returnOptions.map(x=>x.price)):0;
    return activeOptions.filter(option=>{
      const allowed=preference==="Any"||(preference==="Non-stop only"&&option.stops===0)||(preference==="1 stop or fewer"&&option.stops<=1);
      const filterAllowed=filters.stops==="any"||(filters.stops==="nonstop"&&option.stops===0)||(filters.stops==="one"&&option.stops<=1);
      const airlineAllowed=filters.airline==="all"||option.airline===filters.airline;
      const committed=stage==="return"?(outbound?.price||0):0;
      return allowed&&filterAllowed&&airlineAllowed&&((committed+option.price+minReturn)*1.05)<=Number(form.maximumBudget||Infinity);
    }).sort((a,b)=>filters.sort==="duration"?a.duration-b.duration:filters.sort==="departure"?a.depart.localeCompare(b.depart):a.price-b.price);
  },[activeOptions,filters,form.stops,form.maximumBudget,form.tripType,returnOptions,stage,outbound]);

  async function saveWishlist() {
    if(!trip||!outbound||(form.tripType==="Round trip"&&!returning))return;
    setBusy("save");
    try {
      const supabase=getSupabaseBrowserClient();const {data:{user},error:userError}=await supabase.auth.getUser();
      if(userError||!user){router.push("/login.html?returnTo=%2Fservices.html");return;}
      const title=trip.origin.label+" to "+trip.destination.label;
      const result=wishlistId
        ? await supabase.from("flight_wishlists").update({title,itinerary:trip}).eq("id",wishlistId).eq("user_id",user.id).select("id").single()
        : await supabase.from("flight_wishlists").insert({user_id:user.id,title,itinerary:trip}).select("id").single();
      if(result.error)throw result.error;
      if(!wishlistId)setWishlistId(result.data.id);
      setMessage({text:wishlistId?"Your saved trip has been updated with the itinerary you just selected.":"Saved to your wishlist. Find it in your dashboard whenever you're ready.",kind:"success"});
    } catch { setMessage({text:"We couldn't save this itinerary. Please try again.",kind:"error"}); }
    finally {setBusy("");}
  }

  async function requestBooking() {
    if(!trip||!outbound||(form.tripType==="Round trip"&&!returning))return;
    setBusy("book");
    try {
      const response=await fetch("/api/flight-bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(trip)});
      const result=await response.json();
      if(response.status===401){router.push("/login.html?returnTo=%2Fservices.html");return;}
      if(!response.ok)throw new Error(result.error||"Request failed");
      setMessage({text:"Booking request "+result.bookingReference+" is in your dashboard. Travel Qila must reconfirm live availability and final fare before ticketing.",kind:"success"});
    } catch(error) { setMessage({text:error.message||"We couldn't submit your request. Please try again.",kind:"error"}); }
    finally {setBusy("");}
  }

  function share(channel) {
    if(!trip||!outbound)return;
    const lines=["Hello Travel Qila, I would like to request this flight itinerary.","Trip: "+trip.tripType,"Route: "+trip.origin.label+" ("+(trip.origin.code||"")+") to "+trip.destination.label+" ("+(trip.destination.code||"")+")","Departure: "+formatDate(trip.departureDate),trip.tripType==="Round trip"?"Return: "+formatDate(trip.returnDate):"","Passengers: "+passengers+" passenger(s)","Cabin: "+trip.cabin,"Outbound: "+outbound.airline+" "+outbound.flight+" | "+outbound.depart+"–"+outbound.arrive+" | "+formatDate(outbound.departureDate)+" | "+money(outbound.price)+" per passenger",returning?"Return flight: "+returning.airline+" "+returning.flight+" | "+returning.depart+"–"+returning.arrive+" | "+formatDate(returning.departureDate)+" | "+money(returning.price)+" per passenger":"","Base fare estimate: "+money(pricing.baseFare),"Illustrative tax estimate: "+money(pricing.taxAmount),"Estimated demo total: "+money(pricing.totalFare),trip.additionalPreferences?"Additional preferences: "+trip.additionalPreferences:"","Please reconfirm live availability, final fare, taxes and terms. I understand this is an enquiry, not a confirmed ticket."].filter(Boolean).join("\n");
    if(channel==="whatsapp")window.open("https://wa.me/919871101345?text="+encodeURIComponent(lines),"_blank","noopener,noreferrer");
    else window.open("mailto:info@travelqila.com?subject="+encodeURIComponent("Travel Qila - Flight booking enquiry")+"&body="+encodeURIComponent(lines),"_self");
  }

  return <div className="flight-workspace">
    <section className="flight-hero"><div className="container flight-hero-inner"><p className="eyebrow">Travel Qila · Flight assistance</p><h1>Where would you like<br /><em>to fly next?</em></h1><p>Share your route, dates and preferences. Explore illustrative flight options and send a request to our travel team.</p><div className="flight-hero-points"><span>Route guidance</span><span>Budget-aware options</span><span>Human assistance</span></div></div></section>
    <section className="container flight-panel-wrap">
      <div className="flight-panel">
        <div className="flight-panel-heading"><div><p className="eyebrow eyebrow-blue">Start planning</p><h2>Search flights</h2></div><span>Personalised travel assistance</span></div>
        <form id="flightSearchForm" className="flight-form" onSubmit={submit}>
          <div className="trip-type"><label><input type="radio" name="tripType" value="Round trip" checked={form.tripType==="Round trip"} onChange={change}/> Round trip</label><label><input type="radio" name="tripType" value="One way" checked={form.tripType==="One way"} onChange={change}/> One way</label></div>
          <datalist id="airportSuggestions">{Object.entries(airportMap).map(([code,city])=><option key={code} value={city+" ("+code+")"}/>)}</datalist>
          <div className="flight-field-grid">
            <label>From<input id="origin" name="origin" list="airportSuggestions" value={form.origin} onChange={change} placeholder="City or airport" required maxLength={120}/></label>
            <button className="flight-swap" type="button" aria-label="Swap departure and destination" onClick={()=>setForm(f=>({...f,origin:f.destination,destination:f.origin}))}>⇄</button>
            <label>To<input id="destination" name="destination" list="airportSuggestions" value={form.destination} onChange={change} placeholder="City or airport" required maxLength={120}/></label>
            <label>Departure<input id="departDate" type="date" name="departureDate" min={minDate||undefined} value={form.departureDate} onChange={change} required/></label>
            <label id="returnDateWrap" hidden={form.tripType!=="Round trip"}>Return<input id="returnDate" type="date" name="returnDate" min={form.departureDate||minDate} value={form.returnDate} onChange={change} required={form.tripType==="Round trip"}/></label>
          </div>
          <div className="flight-secondary-grid">
            <label>Cabin class<select name="cabin" value={form.cabin} onChange={change}><option>Economy</option><option>Premium Economy</option><option>Business</option><option>First Class</option></select></label>
            <label>Adults<select name="adults" value={form.adults} onChange={change}>{Array.from({length:9},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></label>
            <label>Children<select name="children" value={form.children} onChange={change}>{Array.from({length:7},(_,i)=><option key={i} value={i}>{i}</option>)}</select></label>
            <label>Infants<select name="infants" value={form.infants} onChange={change}>{Array.from({length:7},(_,i)=><option key={i} value={i}>{i}</option>)}</select></label>
            <label>Stops<select id="stops" name="stops" value={form.stops} onChange={change}><option>Any</option><option>Non-stop only</option><option>1 stop or fewer</option></select></label>
            <label>Date flexibility<select id="flexibility" name="dateFlexibility" value={form.dateFlexibility} onChange={change}><option>Exact dates</option><option>1 day before or after</option><option>3 days before or after</option><option>Flexible - lowest fare matters most</option></select></label>
          </div>
          <div className="flight-budget"><label htmlFor="maximumBudget">Maximum budget per passenger <strong>{money(form.maximumBudget)}</strong></label><input id="maxPrice" type="range" name="maximumBudget" min="5000" max="200000" step="5000" value={form.maximumBudget} onChange={change}/><div><span>₹5,000</span><span>₹2,00,000</span></div></div>
          <label className="flight-notes">Additional preferences<textarea id="notes" name="additionalPreferences" rows="2" maxLength={600} value={form.additionalPreferences} onChange={change} placeholder="Preferred airline, baggage needs, meal preference or special request"/></label>
          <button className="button flight-submit" type="submit" value="search">Find flights <span aria-hidden="true">↗</span></button>
        </form>
        {message.text&&<div className={`flight-message is-${message.kind}`} role={message.kind==="error"?"alert":"status"}>{message.text}</div>}
      </div>
    </section>

    {stage!=="form"&&<section id="flightResults" className="container flight-results" aria-live="polite">
      <div className="flight-results-heading"><div><p className="eyebrow eyebrow-blue">{stage==="summary"?"Your itinerary":"Flight options"}</p><h2 id="resultRoute">{stage==="summary"?"Review & save":stage==="return"?"Choose your return flight":"Choose your departure flight"}</h2><p>{form.origin} → {form.destination} · {form.tripType} · {passengers} passenger(s)</p></div><button className="flight-reset" onClick={()=>setStage("form")}>Edit search</button></div>
      {stage!=="summary"?<>
        {stage==="return"&&<button className="flight-back" onClick={()=>{setStage("outbound");setReturning(null);}}>← Change departure flight</button>}
        <div className="flight-filters"><label>Stops<select value={filters.stops} onChange={e=>setFilters(f=>({...f,stops:e.target.value}))}><option value="any">Any stops</option><option value="nonstop">Non-stop</option><option value="one">Up to 1 stop</option></select></label><label>Airline<select value={filters.airline} onChange={e=>setFilters(f=>({...f,airline:e.target.value}))}><option value="all">All airlines</option><option>IndiGo</option><option>Air India</option><option>Akasa Air</option><option>Air India Express</option></select></label><label>Sort by<select value={filters.sort} onChange={e=>setFilters(f=>({...f,sort:e.target.value}))}><option value="price">Lowest fare</option><option value="duration">Shortest duration</option><option value="departure">Departure time</option></select></label></div>
        <p id="flightResultsCount" className="flight-count">{filtered.length} demo flight options</p>
        <div id="flightResultsList" className="flight-option-list">{filtered.map(option=><article className="flight-option flight-result-card" key={option.id}><div className="flight-option-top"><div><strong>{option.airline}</strong><small className="flight-flight-number">{option.flight} · {option.stops===0?"Non-stop":option.stops+" stop"}</small></div><div className="flight-option-price">{money(option.price)}<small>demo fare / passenger</small></div></div><div className="flight-route"><div><strong>{option.depart}</strong><span className="flight-city">{option.origin.label} ({option.origin.code||"—"})</span></div><div className="flight-route-middle"><small>{durationText(option.duration)}</small><span></span><small>{option.stops===0?"Non-stop":option.stops+" stop"}</small></div><div className="flight-route-end"><strong>{option.arrive}</strong><span className="flight-city">{option.destination.label} ({option.destination.code||"—"})</span></div></div><div className="flight-option-bottom"><span>{formatDate(option.departureDate)} · {option.baggage}</span><button data-select-leg={stage==="return"?"return":"outbound"} onClick={()=>{if(stage==="outbound"){setOutbound(option);if(form.tripType==="Round trip")setStage("return");else{setReturning(null);setStage("summary");}}else{setReturning(option);setStage("summary");}}}>Select this {stage==="return"?"return":"departure"} flight →</button></div></article>)}</div>
        {!filtered.length&&<div className="flight-empty"><h3>No flights match these filters</h3><p>Try another airline, stop preference or a higher budget.</p></div>}
      </>:<div className="flight-summary-card">
        <div className="flight-summary-title"><div><span>YOUR ITINERARY</span><h3>{trip.origin.label} ↔ {trip.destination.label}</h3><p>{trip.tripType} · {passengers} passenger(s) · {trip.cabin}</p></div><button className="flight-reset" onClick={()=>setStage(form.tripType==="Round trip"?"return":"outbound")}>Edit flights</button></div>
        <SummaryLeg leg={outbound} label="Outbound"/>{returning&&<SummaryLeg leg={returning} label="Return"/>}
        <div className="flight-price-breakdown tq-price-breakdown"><div><span>Base fare · all passengers</span><strong>{money(pricing.baseFare)}</strong></div><div><span>Estimated taxes & fees (illustrative 5%)</span><strong>{money(pricing.taxAmount)}</strong></div><div className="flight-grand-total"><span>Estimated total</span><strong>{money(pricing.totalFare)}</strong></div><small>Demo estimate only. Actual airline taxes, convenience fees, fare rules and availability may change. A live fare check is required before payment.</small></div>
        <div className="flight-summary-actions"><button data-book-itinerary className="button" onClick={requestBooking} disabled={busy==="book"}>{busy==="book"?"Submitting…":"Request booking"}</button><button data-save-wishlist className="button button-outline" onClick={saveWishlist} disabled={busy==="save"}>{busy==="save"?"Saving…":wishlistId?"Update saved trip":"Save to wishlist"}</button><button data-share-itinerary className="button button-outline" onClick={()=>share("whatsapp")}>WhatsApp</button><button data-share-itinerary className="button button-outline" onClick={()=>share("email")}>Email</button></div>
      </div>}
    </section>}
    <section className="flight-reassurance"><div className="container"><div><span>01</span><h3>Route guidance</h3><p>Share your travel plan and get help with suitable routing.</p></div><div><span>02</span><h3>Budget-aware options</h3><p>Explore illustrative choices based on your preferences.</p></div><div><span>03</span><h3>Human assistance</h3><p>Our team will help reconfirm live fares and availability.</p></div></div></section>
    <section className="flight-faq container"><p className="eyebrow eyebrow-blue">Before you request</p><h2>Flight booking FAQs</h2><details><summary>Are the displayed fares live airline prices?</summary><p>No. These are illustrative demo fares to help you review a sample itinerary. Live availability, final fare, taxes and fare rules must be reconfirmed by Travel Qila.</p></details><details><summary>Does requesting a booking confirm my ticket?</summary><p>No. A request is saved to your account for follow-up. It is not a confirmed ticket or payment.</p></details><details><summary>Can I save an itinerary and return later?</summary><p>Yes. Sign in to save a selected itinerary to your wishlist and revisit it from your dashboard.</p></details></section>
  </div>;
}

function SummaryLeg({leg,label}) { return <div className="flight-summary-leg tq-summary-leg"><small className="tq-summary-leg-title">{label} · {formatDate(leg.departureDate)}</small><strong>{leg.airline} · {leg.flight}</strong><p>{leg.origin.label} ({leg.origin.code||"—"}) → {leg.destination.label} ({leg.destination.code||"—"})</p><span>{leg.depart} – {leg.arrive} · {durationText(leg.duration)} · {money(leg.price)} per passenger</span></div>; }
