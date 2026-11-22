"use client";

import { useEffect, useMemo, useState } from "react";\nimport { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const HOTELS = [
 {id:"goa-seabreeze",name:"Seabreeze Resort & Spa",city:"Goa",area:"Candolim Beach",stars:5,rate:7200,guests:4,amenities:["Beach access","Pool","Breakfast"],image:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=85",tag:"Beachfront escape"},
 {id:"goa-palm",name:"Palm Grove Boutique Hotel",city:"Goa",area:"Calangute",stars:4,rate:4300,guests:3,amenities:["Pool","Restaurant","Wi-Fi"],image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=85",tag:"Guest favourite"},
 {id:"jaipur-royal",name:"The Royal Courtyard",city:"Jaipur",area:"Civil Lines",stars:5,rate:6100,guests:4,amenities:["Heritage stay","Pool","Breakfast"],image:"https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=85",tag:"Heritage luxury"},
 {id:"jaipur-pink",name:"Pink City Residency",city:"Jaipur",area:"MI Road",stars:3,rate:2600,guests:2,amenities:["Restaurant","Wi-Fi","Parking"],image:"https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=85",tag:"Great value"},
 {id:"dubai-marina",name:"Marina View Hotel",city:"Dubai",area:"Dubai Marina",stars:5,rate:9800,guests:4,amenities:["Marina view","Pool","Gym"],image:"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=85",tag:"City & marina"},
 {id:"bangkok-riverside",name:"Riverside Grand Bangkok",city:"Bangkok",area:"Riverside",stars:5,rate:6800,guests:3,amenities:["River view","Pool","Spa"],image:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=85",tag:"Riverside retreat"},
 {id:"delhi-aero",name:"Aero Suites New Delhi",city:"New Delhi",area:"Aerocity",stars:4,rate:5400,guests:3,amenities:["Airport shuttle","Restaurant","Gym"],image:"https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1000&q=85",tag:"Airport convenience"},
 {id:"manali-pines",name:"Pine & Peak Retreat",city:"Manali",area:"Old Manali",stars:4,rate:3900,guests:3,amenities:["Mountain view","Cafe","Parking"],image:"https://images.unsplash.com/photo-1449158743715-0a90b84031e7?auto=format&fit=crop&w=1000&q=85",tag:"Mountain hideaway"}
];
const currency = new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});
const localDate = () => {const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);};
const nightsBetween = (a,b) => Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000);
function quote(hotel,checkIn,checkOut,rooms=1) {const nights=nightsBetween(checkIn,checkOut);const base=hotel.rate*nights*rooms;const tax=Math.round(base*.12);return {nights,base,tax,total:base+tax};}

export default function HotelSearch({ today }) {\n  const router = useRouter();
  const [form,setForm]=useState({destination:"",checkIn:today,checkOut:"",guests:"2",rooms:"1",stars:"0",maxPrice:""});
  const [searched,setSearched]=useState(false);
  const [user,setUser]=useState(null);
  const [wishlist,setWishlist]=useState([]);
  const [message,setMessage]=useState({text:"",kind:"info"});
  const [whatsapp,setWhatsapp]=useState("");
  const [minDate,setMinDate]=useState("");
  const [busy,setBusy]=useState("");

  useEffect(()=>{
    let active = true;
    try {
      getSupabaseBrowserClient().auth.getUser().then(async ({data,error})=>{
        if(!active)return;
        const currentUser=data?.user||null;
        setUser(currentUser);
        if(currentUser&&!error){
          const {data:rows,error:loadError}=await getSupabaseBrowserClient()
            .from("hotel_wishlists").select("hotel_id").eq("user_id",currentUser.id);
          if(active&&!loadError)setWishlist((rows||[]).map(row=>row.hotel_id));
        }
      }).catch(()=>{});
    } catch {
      // Search remains available before Supabase environment configuration.
    }
    return ()=>{active=false;};
  },[]);

  function change(event) {const {name,value}=event.target;setForm(current=>({...current,[name]:value}));if(name==="checkIn"&&form.checkOut&&form.checkOut<=value)setForm(current=>({...current,checkOut:""}));}
  const found=useMemo(()=>{
    if(!searched||!form.destination||!form.checkIn||!form.checkOut||nightsBetween(form.checkIn,form.checkOut)<1)return [];
    return HOTELS.filter(h=>(h.city+" "+h.area+" "+h.name).toLowerCase().includes(form.destination.toLowerCase())&&h.guests*Number(form.rooms)>=Number(form.guests)&&(!Number(form.stars)||h.stars>=Number(form.stars))).map(h=>({...h,quote:quote(h,form.checkIn,form.checkOut,Number(form.rooms))})).filter(h=>!Number(form.maxPrice)||h.quote.total<=Number(form.maxPrice));
  },[searched,form]);

  function submit(event) {
    event.preventDefault();setMessage({text:"",kind:"info"});setWhatsapp("");
    const channel=event.nativeEvent.submitter?.value;
    if(!form.destination.trim()||!form.checkIn||!form.checkOut||nightsBetween(form.checkIn,form.checkOut)<1){setMessage({text:"Enter a destination and a check-out date after check-in.",kind:"error"});return;}
    if(channel==="whatsapp"||channel==="email"){
      const details=["Hello Travel Qila, I would like hotel booking assistance.","Destination: "+form.destination,"Check-in: "+form.checkIn,"Check-out: "+form.checkOut,"Rooms: "+form.rooms,"Guests: "+form.guests,"Minimum rating: "+form.stars+" stars","Maximum total price: "+(form.maxPrice||"No limit")].join("\n");
      if(channel==="whatsapp"){
        const url="https://wa.me/919871101345?text="+encodeURIComponent(details);
        setWhatsapp(url);window.open(url,"_blank","noopener,noreferrer");
        setMessage({text:"WhatsApp should open with your enquiry pre-filled. Please press Send to submit it.",kind:"success"});
      }else{
        window.open("mailto:info@travelqila.com?subject="+encodeURIComponent("Travel Qila hotel enquiry")+"&body="+encodeURIComponent(details),"_self");
        setMessage({text:"Your email app should open with your enquiry pre-filled. Please press Send to submit it.",kind:"success"});
      }
      return;
    }
    setSearched(true);
  }

  async function toggleWishlist(hotel) {
    if(!user){router.push("/login.html?returnTo=%2Fhotels.html");return;}
    setBusy(hotel.id);setMessage({text:"",kind:"info"});
    const isSaved=wishlist.includes(hotel.id);
    const q=form.checkIn&&form.checkOut&&nightsBetween(form.checkIn,form.checkOut)>0?quote(hotel,form.checkIn,form.checkOut,Number(form.rooms)):{nights:1,base:hotel.rate*Number(form.rooms),tax:Math.round(hotel.rate*Number(form.rooms)*.12),total:Math.round(hotel.rate*Number(form.rooms)*1.12)};
    try {
      if(isSaved){
        const {error}=await getSupabaseBrowserClient().from("hotel_wishlists").delete().eq("user_id",user.id).eq("hotel_id",hotel.id);
        if(error)throw error;
        setWishlist(rows=>rows.filter(id=>id!==hotel.id));
        setMessage({text:"Hotel removed from your wishlist.",kind:"success"});
      }else{
        const {error}=await getSupabaseBrowserClient().from("hotel_wishlists").insert({user_id:user.id,hotel_id:hotel.id,hotel_name:hotel.name,destination:hotel.city,star_rating:hotel.stars,nightly_rate:hotel.rate,taxes:q.tax,total_price:q.total,currency:"INR",image_url:hotel.image,check_in:form.checkIn,check_out:form.checkOut,guests:Number(form.guests)});
        if(error)throw error;
        setWishlist(rows=>[...rows,hotel.id]);
        setMessage({text:"Hotel saved to your dashboard wishlist.",kind:"success"});
      }
    }catch(error){setMessage({text:error.code==="23505"?"This hotel is already in your wishlist.":"We couldn't update your wishlist. Please try again.",kind:"error"});}
    finally{setBusy("");}
  }

  async function bookHotel(hotel) {
    if(!user){router.push("/login.html?returnTo=%2Fhotels.html");return;}
    if(!form.checkIn||!form.checkOut||nightsBetween(form.checkIn,form.checkOut)<1){setMessage({text:"Please choose valid check-in and check-out dates first.",kind:"error"});return;}
    setBusy(hotel.id);setMessage({text:"",kind:"info"});setWhatsapp("");
    try{
      const response=await fetch("/api/hotel-bookings",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({hotelId:hotel.id,checkIn:form.checkIn,checkOut:form.checkOut,guests:Number(form.guests),rooms:Number(form.rooms)})});
      const result=await response.json();
      if(response.status===401){router.push("/login.html?returnTo=%2Fhotels.html");return;}
      if(!response.ok)throw new Error(result.error||"Request failed");
      setMessage({text:"Your hotel enquiry has been saved to your dashboard. Our team will contact you to confirm live availability and the final rate.",kind:"success"});
      const text=["Hello Travel Qila, I would like to book this hotel.","Hotel: "+hotel.name,"Destination: "+hotel.city,"Check-in: "+form.checkIn,"Check-out: "+form.checkOut,"Guests: "+form.guests,"Estimated total incl. taxes: "+currency.format(result.estimatedTotal),"Enquiry ID: "+result.enquiryId].join("\n");
      setWhatsapp("https://wa.me/919871101345?text="+encodeURIComponent(text));
    }catch{setMessage({text:"Your request could not be saved. Please try again or contact our team.",kind:"error"});}
    finally{setBusy("");}
  }

  return <div className="hotel-workspace">
    <section className="hotel-hero"><div className="container"><p className="eyebrow">Travel Qila · Hotel assistance</p><h1>Find the right stay for<br/><em>your next destination.</em></h1><p>Share your destination, dates and group details. Explore sample stays and request personalised hotel assistance.</p><div className="hotel-hero-points"><span>Curated stays</span><span>Clear price estimates</span><span>Personal support</span></div></div></section>
    <section className="container hotel-search-wrap"><div className="hotel-search-panel"><div className="hotel-panel-title"><div><p className="eyebrow eyebrow-blue">Start with your destination</p><h2>Search hotels</h2></div><span>Find a stay that fits your journey</span></div>
      <form id="hotelSearchForm" data-service="hotel booking" className="hotel-search-form service-enquiry-form" onSubmit={submit}>
        <label>Destination<input id="hotelDestination" name="destination" list="hotelDestinations" value={form.destination} onChange={change} placeholder="City, area or hotel" required maxLength={100}/><datalist id="hotelDestinations">{["Goa","Jaipur","Dubai","Bangkok","New Delhi","Manali"].map(city=><option key={city} value={city}/>)}</datalist></label>
        <label>Check-in<input id="checkin" type="date" name="checkIn" min={today} value={form.checkIn} onChange={change} required/></label>
        <label>Check-out<input id="checkout" type="date" name="checkOut" min={form.checkIn||today} value={form.checkOut} onChange={change} required/></label>
        <label>Guests<select id="hotelAdults" name="guests" value={form.guests} onChange={change}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{i+1} guest(s)</option>)}</select></label>
        <label>Minimum rating<select id="hotelCategory" name="stars" value={form.stars} onChange={change}><option value="0">Any rating</option>{[3,4,5].map(n=><option key={n} value={n}>{n}+ stars</option>)}</select></label>
        <label>Maximum total price<input id="maxPrice" name="maxPrice" type="number" min="0" step="500" value={form.maxPrice} onChange={change} placeholder="No limit"/></label>
        <label>Rooms<select id="hotelRooms" name="rooms" value={form.rooms} onChange={change}>{Array.from({length:6},(_,i)=><option key={i} value={i+1}>{i+1} room(s)</option>)}</select></label><button className="button hotel-search-button" type="submit" value="search">Search stays <span aria-hidden="true">↗</span></button><div className="hotel-form-handoffs"><button type="submit" value="whatsapp">Send enquiry on WhatsApp</button><button type="submit" value="email">Send enquiry by email</button></div>
      </form>
      {message.text&&<div id="hotelStatus" data-form-status className={`hotel-message is-${message.kind}`} role={message.kind==="error"?"alert":"status"}>{message.text}</div>}
      {whatsapp&&<a id="hotelWhatsapp" className="hotel-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">Continue on WhatsApp ↗</a>}
    </div></section>
    <section className="container hotel-results-section" id="hotelResults">
      <div id="hotelResultsHeading" className="hotel-results-heading"><div><p className="eyebrow eyebrow-blue">Recommended stays</p><h2 id="resultCount">{searched?found.length+" stay"+(found.length===1?"":"s")+" matching your search":"A few places to get inspired"}</h2></div><span>Rates shown in INR</span></div>
      {!searched?<div className="hotel-empty"><h3>Start with your destination</h3><p>Enter a city and valid check-in/check-out dates to explore stays.</p></div>:!found.length?<div className="hotel-empty"><h3>No stays match these filters</h3><p>Try a nearby destination, lower star rating or a higher budget.</p></div>:<div className="hotel-result-list">{found.map(hotel=><article className="hotel-result-card hotel-result" key={hotel.id}>
        <div className="hotel-photo"><Image src={hotel.image} alt={hotel.name} fill sizes="(max-width: 700px) 100vw, 360px" /><span>{hotel.tag}</span></div>
        <div className="hotel-info"><div className="hotel-stars">{"★".repeat(hotel.stars)} <span>{hotel.stars}-star stay</span></div><h3>{hotel.name}</h3><p className="hotel-location">{hotel.area}, {hotel.city}</p><div className="hotel-amenities">{hotel.amenities.map(item=><span key={item}>{item}</span>)}</div><small>Up to {hotel.guests} guests</small></div>
        <div className="hotel-price"><div className="hotel-rate">{currency.format(hotel.rate)} <small>/ night</small></div><div className="hotel-total">{currency.format(hotel.quote.total)} <small>total incl. taxes</small></div><div className="hotel-breakdown">{hotel.quote.nights} nights · {currency.format(hotel.quote.base)} room + {currency.format(hotel.quote.tax)} taxes (12%)</div><button data-book={hotel.id} className="button hotel-book" onClick={()=>bookHotel(hotel)} disabled={busy===hotel.id}>{busy===hotel.id?"Please wait…":"Request booking"}</button><button data-wish={hotel.id} className={`hotel-wish ${wishlist.includes(hotel.id)?"saved":""}`} onClick={()=>toggleWishlist(hotel)} disabled={busy===hotel.id}>{wishlist.includes(hotel.id)?"♥ Saved to wishlist":"♡ Save to wishlist"}</button></div>
      </article>)}</div>}
    </section>
    <section className="hotel-disclaimer container"><p>Hotel names, inventory and rates shown here are sample listings for enquiry purposes, not confirmed live availability. Your request is saved to your account; the final rate and reservation require confirmation by our team.</p></section>
  </div>;
}
