"use client";

import { useEffect, useMemo, useState } from "react";
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
 {id:"delhi-aero",name:"Aero Suites New Delhi",city:"New Delhi",area:"Aerocity",stars:4,rate:5400,guests:3,amenities:["Airport shuttle","Restaurant","Gym"],image:"https://images.unsplash.com/photo-1564501049411-0b1b9f6a0f70?auto=format&fit=crop&w=1000&q=85",tag:"Airport convenience"},
 {id:"manali-pines",name:"Pine & Peak Retreat",city:"Manali",area:"Old Manali",stars:4,rate:3900,guests:3,amenities:["Mountain view","Cafe","Parking"],image:"https://images.unsplash.com/photo-1449158743715-0a90b84031e7?auto=format&fit=crop&w=1000&q=85",tag:"Mountain hideaway"}
];
const currency = new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});
const localDate = () => {const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);};
const nightsBetween = (a,b) => Math.round((new Date(b+"T00:00:00")-new Date(a+"T00:00:00"))/86400000);
function quote(hotel,checkIn,checkOut) {const nights=nightsBetween(checkIn,checkOut);const base=hotel.rate*nights;const tax=Math.round(base*.12);return {nights,base,tax,total:base+tax};}

export default function HotelSearch() {
  const [form,setForm]=useState({destination:"",checkIn:"",checkOut:"",guests:"2",stars:"0",maxPrice:""});
  const [searched,setSearched]=useState(false);
  const [user,setUser]=useState(null);
  const [wishlist,setWishlist]=useState([]);
  const [message,setMessage]=useState({text:"",kind:"info"});
  const [whatsapp,setWhatsapp]=useState("");
  const [busy,setBusy]=useState("");

  useEffect(()=>{
    setForm(current=>({...current,checkIn:localDate()}));
    let active=true;
    getSupabaseBrowserClient().auth.getUser().then(async({data,error})=>{
      if(!active)return;
      const current=data?.user||null;setUser(current);
      if(current&&!error){
        const {data:rows,error:loadError}=await getSupabaseBrowserClient().from("hotel_wishlists").select("hotel_id").eq("user_id",current.id);
        if(active&&!loadError)setWishlist((rows||[]).map(row=>row.hotel_id));
      }
    }).catch(()=>{});
    return()=>{active=false;};
  },[]);

  function change(event) {const {name,value}=event.target;setForm(current=>({...current,[name]:value}));if(name==="checkIn"&&form.checkOut&&form.checkOut<=value)setForm(current=>({...current,checkOut:""}));}
  const found=useMemo(()=>{
    if(!searched||!form.destination||!form.checkIn||!form.checkOut||nightsBetween(form.checkIn,form.checkOut)<1)return [];
    return HOTELS.filter(h=>(h.city+" "+h.area+" "+h.name).toLowerCase().includes(form.destination.toLowerCase())&&h.guests>=Number(form.guests)&&(!Number(form.stars)||h.stars>=Number(form.stars))).map(h=>({...h,quote:quote(h,form.checkIn,form.checkOut)})).filter(h=>!Number(form.maxPrice)||h.quote.total<=Number(form.maxPrice));
  },[searched,form]);

  function submit(event) {
    event.preventDefault();setMessage({text:"",kind:"info"});setWhatsapp("");
    if(!form.destination.trim()||!form.checkIn||!form.checkOut||nightsBetween(form.checkIn,form.checkOut)<1){setMessage({text:"Enter a destination and a check-out date after check-in.",kind:"error"});return;}
    setSearched(true);
  }

  async function toggleWishlist(hotel) {
    if(!user){window.location.href="/login.html?returnTo=%2Fhotels.html";return;}
    setBusy(hotel.id);setMessage({text:"",kind:"info"});
    const isSaved=wishlist.includes(hotel.id);
    const q=quote(hotel,form.checkIn,form.checkOut);
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
    if(!user){window.location.href="/login.html?returnTo=%2Fhotels.html";return;}
    if(!form.checkIn||!form.checkOut||nightsBetween(form.checkIn,form.checkOut)<1){setMessage({text:"Please choose valid check-in and check-out dates first.",kind:"error"});return;}
    setBusy(hotel.id);setMessage({text:"",kind:"info"});setWhatsapp("");
    const q=quote(hotel,form.checkIn,form.checkOut);
    const customerName=user.user_metadata?.full_name||user.user_metadata?.name||"Traveller";
    try{
      const {data,error}=await getSupabaseBrowserClient().from("hotel_booking_requests").insert({user_id:user.id,hotel_id:hotel.id,hotel_name:hotel.name,destination:hotel.city,check_in:form.checkIn,check_out:form.checkOut,guests:Number(form.guests),rooms:1,nightly_rate:hotel.rate,taxes:q.tax,total_price:q.total,currency:"INR",customer_name:customerName,customer_email:user.email||"Not provided",customer_phone:user.user_metadata?.phone||""}).select("id").single();
      if(error)throw error;
      setMessage({text:"Your hotel enquiry has been saved to your dashboard. Our team will contact you to confirm live availability and the final rate.",kind:"success"});
      const text=["Hello Travel Qila, I would like to book this hotel.","Hotel: "+hotel.name,"Destination: "+hotel.city,"Check-in: "+form.checkIn,"Check-out: "+form.checkOut,"Guests: "+form.guests,"Estimated total incl. taxes: "+currency.format(q.total),"Enquiry ID: "+data.id].join("\n");
      setWhatsapp("https://wa.me/919871101345?text="+encodeURIComponent(text));
    }catch{setMessage({text:"Your request could not be saved. Please try again or contact our team.",kind:"error"});}
    finally{setBusy("");}
  }

  return <div className="hotel-workspace">
    <section className="hotel-hero"><div className="container"><p className="eyebrow">Travel Qila · Hotel assistance</p><h1>Find the right stay for<br/><em>your next destination.</em></h1><p>Share your destination, dates and group details. Explore sample stays and request personalised hotel assistance.</p><div className="hotel-hero-points"><span>Curated stays</span><span>Clear price estimates</span><span>Personal support</span></div></div></section>
    <section className="container hotel-search-wrap"><div className="hotel-search-panel"><div className="hotel-panel-title"><div><p className="eyebrow eyebrow-blue">Start with your destination</p><h2>Search hotels</h2></div><span>Find a stay that fits your journey</span></div>
      <form className="hotel-search-form" onSubmit={submit}>
        <label>Destination<input name="destination" list="hotelDestinations" value={form.destination} onChange={change} placeholder="City, area or hotel" required maxLength={100}/><datalist id="hotelDestinations">{["Goa","Jaipur","Dubai","Bangkok","New Delhi","Manali"].map(city=><option key={city} value={city}/>)}</datalist></label>
        <label>Check-in<input type="date" name="checkIn" min={localDate()} value={form.checkIn} onChange={change} required/></label>
        <label>Check-out<input type="date" name="checkOut" min={form.checkIn||localDate()} value={form.checkOut} onChange={change} required/></label>
        <label>Guests<select name="guests" value={form.guests} onChange={change}>{Array.from({length:12},(_,i)=><option key={i} value={i+1}>{i+1} guest(s)</option>)}</select></label>
        <label>Minimum rating<select name="stars" value={form.stars} onChange={change}><option value="0">Any rating</option>{[3,4,5].map(n=><option key={n} value={n}>{n}+ stars</option>)}</select></label>
        <label>Maximum total price<input name="maxPrice" type="number" min="0" step="500" value={form.maxPrice} onChange={change} placeholder="No limit"/></label>
        <button className="button hotel-search-button" type="submit">Search stays <span aria-hidden="true">↗</span></button>
      </form>
      {message.text&&<div className={`hotel-message is-${message.kind}`} role={message.kind==="error"?"alert":"status"}>{message.text}</div>}
      {whatsapp&&<a className="hotel-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">Continue on WhatsApp ↗</a>}
    </div></section>
    <section className="container hotel-results-section" id="hotelResultsHeading">
      <div className="hotel-results-heading"><div><p className="eyebrow eyebrow-blue">Recommended stays</p><h2>{searched?found.length+" stay"+(found.length===1?"":"s")+" matching your search":"A few places to get inspired"}</h2></div><span>Rates shown in INR</span></div>
      {!searched?<div className="hotel-empty"><h3>Start with your destination</h3><p>Enter a city and valid check-in/check-out dates to explore stays.</p></div>:!found.length?<div className="hotel-empty"><h3>No stays match these filters</h3><p>Try a nearby destination, lower star rating or a higher budget.</p></div>:<div className="hotel-result-list">{found.map(hotel=><article className="hotel-result-card" key={hotel.id}>
        <div className="hotel-photo"><Image src={hotel.image} alt={hotel.name} fill sizes="(max-width: 700px) 100vw, 360px" /><span>{hotel.tag}</span></div>
        <div className="hotel-info"><div className="hotel-stars">{"★".repeat(hotel.stars)} <span>{hotel.stars}-star stay</span></div><h3>{hotel.name}</h3><p className="hotel-location">{hotel.area}, {hotel.city}</p><div className="hotel-amenities">{hotel.amenities.map(item=><span key={item}>{item}</span>)}</div><small>Up to {hotel.guests} guests</small></div>
        <div className="hotel-price"><div className="hotel-rate">{currency.format(hotel.rate)} <small>/ night</small></div><div className="hotel-total">{currency.format(hotel.quote.total)} <small>total incl. taxes</small></div><div className="hotel-breakdown">{hotel.quote.nights} nights · {currency.format(hotel.quote.base)} room + {currency.format(hotel.quote.tax)} taxes (12%)</div><button className="button hotel-book" onClick={()=>bookHotel(hotel)} disabled={busy===hotel.id}>{busy===hotel.id?"Please wait…":"Request booking"}</button><button className={`hotel-wish ${wishlist.includes(hotel.id)?"saved":""}`} onClick={()=>toggleWishlist(hotel)} disabled={busy===hotel.id}>{wishlist.includes(hotel.id)?"♥ Saved to wishlist":"♡ Save to wishlist"}</button></div>
      </article>)}</div>}
    </section>
    <section className="hotel-disclaimer container"><p>Hotel names, inventory and rates shown here are sample listings for enquiry purposes, not confirmed live availability. Your request is saved to your account; the final rate and reservation require confirmation by our team.</p></section>
  </div>;
}
