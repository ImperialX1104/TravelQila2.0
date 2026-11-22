import { supabase, authPageUrl } from "./auth-client.js";

const HOTEL_DATA = [
 {id:"goa-seabreeze",name:"Seabreeze Resort & Spa",city:"Goa",area:"Candolim Beach",stars:5,rate:7200,guests:3,amenities:["Beach access","Pool","Breakfast"],image:"https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1000&q=85",tag:"Beachfront escape"},
 {id:"goa-palm",name:"Palm Grove Boutique Hotel",city:"Goa",area:"Calangute",stars:4,rate:4300,guests:3,amenities:["Pool","Restaurant","Wi-Fi"],image:"https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=85",tag:"Guest favourite"},
 {id:"jaipur-royal",name:"The Royal Courtyard",city:"Jaipur",area:"Civil Lines",stars:5,rate:6100,guests:3,amenities:["Heritage stay","Pool","Breakfast"],image:"https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1000&q=85",tag:"Heritage luxury"},
 {id:"jaipur-pink",name:"Pink City Residency",city:"Jaipur",area:"MI Road",stars:3,rate:2600,guests:2,amenities:["Restaurant","Wi-Fi","Parking"],image:"https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1000&q=85",tag:"Great value"},
 {id:"dubai-marina",name:"Marina View Hotel",city:"Dubai",area:"Dubai Marina",stars:5,rate:9800,guests:3,amenities:["Marina view","Pool","Gym"],image:"https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=85",tag:"City & marina"},
 {id:"bangkok-riverside",name:"Riverside Grand Bangkok",city:"Bangkok",area:"Riverside",stars:5,rate:6800,guests:3,amenities:["River view","Pool","Spa"],image:"https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1000&q=85",tag:"Riverside retreat"},
 {id:"delhi-aero",name:"Aero Suites New Delhi",city:"New Delhi",area:"Aerocity",stars:4,rate:5400,guests:3,amenities:["Airport shuttle","Restaurant","Gym"],image:"https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1000&q=85",tag:"Airport convenience"},
 {id:"manali-pines",name:"Pine & Peak Retreat",city:"Manali",area:"Old Manali",stars:4,rate:3900,guests:3,amenities:["Mountain view","Cafe","Parking"],image:"https://images.unsplash.com/photo-1449158743715-0a90b84031e7?auto=format&fit=crop&w=1000&q=85",tag:"Mountain hideaway"}
];

const form=document.querySelector("#hotelSearchForm");
const results=document.querySelector("#hotelResults");
const statusBox=document.querySelector("#hotelStatus");
const resultCount=document.querySelector("#resultCount");
const currency=new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0});
let user=null;
let wishlistIds=new Set();

function message(text,type="info"){statusBox.className="hotel-status is-visible "+type;statusBox.textContent=text;}
function clearMessage(){statusBox.className="hotel-status";statusBox.textContent="";}
function dateNights(start,end){return Math.round((new Date(end+"T00:00:00")-new Date(start+"T00:00:00"))/86400000);}
function searchState(){
 const d=new FormData(form);
 return {destination:String(d.get("destination")||"").trim().toLowerCase(),checkIn:d.get("checkIn"),checkOut:d.get("checkOut"),guests:Number(d.get("guests")),stars:Number(d.get("stars")),maxPrice:Number(d.get("maxPrice")||0)};
}
function quote(h,s){
 const nights=dateNights(s.checkIn,s.checkOut),base=h.rate*nights,tax=Math.round(base*.12);
 return {nights,base,tax,total:base+tax};
}
function safe(value){return String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function renderHotels(){
 const s=searchState();
 if(!s.destination||!s.checkIn||!s.checkOut||dateNights(s.checkIn,s.checkOut)<1){results.innerHTML='<div class="hotel-empty"><i class="fas fa-search"></i><h3>Start with your destination</h3><p>Enter a city and valid check-in/check-out dates to explore stays.</p></div>';resultCount.textContent="";return;}
 const found=HOTEL_DATA.filter(h=>(h.city+" "+h.area+" "+h.name).toLowerCase().includes(s.destination)&&h.guests>=s.guests&&(!s.stars||h.stars>=s.stars)).map(h=>({...h,quote:quote(h,s)})).filter(h=>!s.maxPrice||h.quote.total<=s.maxPrice);
 resultCount.textContent=found.length+" stay"+(found.length===1?"":"s")+" matching your search";
 if(!found.length){results.innerHTML='<div class="hotel-empty"><i class="fas fa-map-marked-alt"></i><h3>No stays match these filters</h3><p>Try a nearby destination, lower star rating or a higher budget.</p></div>';return;}
 results.innerHTML=found.map(h=>`<article class="hotel-result">
  <div class="hotel-photo"><img src="${safe(h.image)}" alt="${safe(h.name)}" loading="lazy"><span>${safe(h.tag)}</span></div>
  <div class="hotel-info"><div class="hotel-stars">${"★".repeat(h.stars)}<span>${h.stars}-star stay</span></div><h3>${safe(h.name)}</h3><p class="hotel-location"><i class="fas fa-map-marker-alt"></i> ${safe(h.area)}, ${safe(h.city)}</p><div class="hotel-amenities">${h.amenities.map(a=>`<span>${safe(a)}</span>`).join("")}</div><small class="hotel-capacity"><i class="fas fa-user-friends"></i> Up to ${h.guests} guests</small></div>
  <div class="hotel-price"><div class="hotel-rate">${currency.format(h.rate)} <small>/ night</small></div><div class="hotel-total">${currency.format(h.quote.total)} <small>total incl. taxes</small></div><div class="hotel-breakdown">${h.quote.nights} nights · ${currency.format(h.quote.base)} room + ${currency.format(h.quote.tax)} taxes (12%)</div><button class="btn btn-primary hotel-book" data-book="${h.id}">Book now</button><button class="btn hotel-wish ${wishlistIds.has(h.id)?"saved":""}" data-wish="${h.id}"><i class="fas fa-heart"></i> ${wishlistIds.has(h.id)?"Saved to wishlist":"Save to wishlist"}</button></div>
 </article>`).join("");
}
async function loadWishlist(){
 if(!user)return;
 const {data,error}=await supabase.from("hotel_wishlists").select("hotel_id").eq("user_id",user.id);
 if(error){console.warn("[Travel Qila] Wishlist could not be loaded:",error.message);return;}
 wishlistIds=new Set((data||[]).map(x=>x.hotel_id));
}
async function toggleWishlist(id){
 if(!user){window.location.href=authPageUrl("login.html")+"?returnTo=hotels.html";return;}
 const h=HOTEL_DATA.find(x=>x.id===id);if(!h)return;
 const s=searchState();const q=s.checkIn&&s.checkOut&&dateNights(s.checkIn,s.checkOut)>0?quote(h,s):{base:h.rate,tax:Math.round(h.rate*.12),total:Math.round(h.rate*1.12)};
 if(wishlistIds.has(id)){
  const {error}=await supabase.from("hotel_wishlists").delete().eq("user_id",user.id).eq("hotel_id",id);
  if(error){message("We couldn't remove this hotel. Please try again.","error");return;}
  wishlistIds.delete(id);message("Hotel removed from your wishlist.","success");
 }else{
  const {error}=await supabase.from("hotel_wishlists").insert({user_id:user.id,hotel_id:id,hotel_name:h.name,destination:h.city,star_rating:h.stars,nightly_rate:h.rate,taxes:q.tax,total_price:q.total,currency:"INR",image_url:h.image,check_in:s.checkIn||null,check_out:s.checkOut||null,guests:s.guests||2});
  if(error){message(error.code==="23505"?"This hotel is already in your wishlist.":"We couldn't save this hotel. Please try again.","error");return;}
  wishlistIds.add(id);message("Hotel saved to your dashboard wishlist.","success");
 }
 renderHotels();
}
async function bookHotel(id){
 if(!user){window.location.href=authPageUrl("login.html")+"?returnTo=hotels.html";return;}
 const s=searchState(),h=HOTEL_DATA.find(x=>x.id===id);
 if(!h||!s.checkIn||!s.checkOut||dateNights(s.checkIn,s.checkOut)<1){message("Please choose valid check-in and check-out dates first.","error");return;}
 const q=quote(h,s);
 const name=user.user_metadata?.full_name||user.user_metadata?.name||"Traveller";
 const {data,error}=await supabase.from("hotel_booking_requests").insert({user_id:user.id,hotel_id:h.id,hotel_name:h.name,destination:h.city,check_in:s.checkIn,check_out:s.checkOut,guests:s.guests,rooms:1,nightly_rate:h.rate,taxes:q.tax,total_price:q.total,currency:"INR",customer_name:name,customer_email:user.email||"Not provided",customer_phone:user.user_metadata?.phone||""}).select("id").single();
 if(error){message("Your request could not be saved. Please try again or contact our team.","error");return;}
 message("Your hotel enquiry has been saved to your dashboard. Our team will contact you to confirm live availability and the final rate.","success");
 const wa="https://wa.me/919871101345?text="+encodeURIComponent("Hello Travel Qila, I would like to book this hotel.\nHotel: "+h.name+"\nDestination: "+h.city+"\nCheck-in: "+s.checkIn+"\nCheck-out: "+s.checkOut+"\nGuests: "+s.guests+"\nEstimated total incl. taxes: "+currency.format(q.total)+"\nEnquiry ID: "+data.id);
 const link=document.querySelector("#hotelWhatsapp");link.href=wa;link.hidden=false;
}
form?.addEventListener("submit",e=>{e.preventDefault();clearMessage();const s=searchState();if(!s.destination||!s.checkIn||!s.checkOut||dateNights(s.checkIn,s.checkOut)<1){message("Enter a destination and a check-out date after check-in.","error");return;}renderHotels();document.querySelector("#hotelResultsHeading").scrollIntoView({behavior:"smooth",block:"start"});});
results?.addEventListener("click",e=>{const wish=e.target.closest("[data-wish]");const book=e.target.closest("[data-book]");if(wish)toggleWishlist(wish.dataset.wish);if(book)bookHotel(book.dataset.book);});
(async()=>{
 const today=new Date();today.setMinutes(today.getMinutes()-today.getTimezoneOffset());const min=today.toISOString().slice(0,10);
 document.querySelector("#checkIn").min=min;document.querySelector("#checkOut").min=min;
 document.querySelector("#checkIn").addEventListener("change",e=>{document.querySelector("#checkOut").min=e.target.value;});
 const {data}=await supabase.auth.getUser();user=data?.user||null;
 await loadWishlist();renderHotels();
})();
