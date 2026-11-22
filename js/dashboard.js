import { supabase, authPageUrl, setAuthMessage, clearAuthMessage } from "./auth-client.js";
"use strict";

const message=document.querySelector("[data-dashboard-message]");
const profileForm=document.querySelector("[data-profile-form]");
const logoutButton=document.querySelector("[data-logout]");
const nameDisplay=document.querySelector("[data-profile-name]");
const emailDisplay=document.querySelector("[data-profile-email]");
const createdDisplay=document.querySelector("[data-profile-created]");
const bookingsList=document.querySelector("[data-bookings-list]");
const bookingsCount=document.querySelector("[data-bookings-count]");
const wishlistList=document.querySelector("[data-wishlist-list]");
const wishlistCount=document.querySelector("[data-wishlist-count]");
let currentUser=null,isSaving=false,isSigningOut=false;

const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const date=v=>{if(!v)return "Date to be confirmed";const d=new Date(v+(String(v).length===10?"T12:00:00":""));return Number.isNaN(d.getTime())?"Date to be confirmed":d.toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});};
const money=v=>"₹"+Number(v||0).toLocaleString("en-IN",{maximumFractionDigits:2});
function showMessage(text,type="info"){setAuthMessage(message,text,type);}
function clearMessage(){clearAuthMessage(message);}
function redirectToLogin(){window.location.replace(authPageUrl("login.html"));}
function formatMemberDate(v){if(!v)return "Not available";const d=new Date(v);return Number.isNaN(d.getTime())?"Not available":d.toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"});}
function populateProfile(user){const m=user.user_metadata||{},name=m.full_name||m.name||"Traveller";if(nameDisplay)nameDisplay.textContent=name;if(emailDisplay)emailDisplay.textContent=user.email||"Not available";if(createdDisplay)createdDisplay.textContent=formatMemberDate(user.created_at);if(profileForm){const n=profileForm.elements.namedItem("full_name"),p=profileForm.elements.namedItem("phone");if(n)n.value=m.full_name||m.name||"";if(p)p.value=m.phone||"";}}
function legMarkup(leg,label){if(!leg)return "";return '<div class="dashboard-booking-leg"><div class="dashboard-booking-leg-title">'+label+' · '+date(leg.departureDate)+'</div><div class="dashboard-booking-airline">'+esc(leg.airline)+' · '+esc(leg.flight)+'</div><div class="dashboard-booking-route"><div><div class="dashboard-booking-city">'+esc(leg.origin?.label||"")+'</div><div class="dashboard-booking-code">'+esc(leg.origin?.code||"")+'</div><small>'+esc(leg.depart||"")+'</small></div><div class="dashboard-booking-arrow"><i class="fas fa-long-arrow-alt-right"></i></div><div class="text-end"><div class="dashboard-booking-city">'+esc(leg.destination?.label||"")+'</div><div class="dashboard-booking-code">'+esc(leg.destination?.code||"")+'</div><small>'+esc(leg.arrive||"")+'</small></div></div></div>';}
function renderBooking(row){
 const status=row.status||"pending_confirmation",label=status==="confirmed"?"Confirmed":status==="cancelled"?"Cancelled":"Pending confirmation",cls=status==="confirmed"?"is-confirmed":status==="cancelled"?"is-cancelled":"";
 const round=row.trip_type==="Round trip";
 const out={airline:row.airline,flight:row.flight_number,depart:row.departure_time,arrive:row.arrival_time,origin:{label:row.origin,code:row.origin_code},destination:{label:row.destination,code:row.destination_code},departureDate:row.departure_date};
 const ret=round?{airline:row.return_airline,flight:row.return_flight_number,depart:row.return_departure_time,arrive:row.return_arrival_time,origin:{label:row.destination,code:row.destination_code},destination:{label:row.origin,code:row.origin_code},departureDate:row.return_date}:null;
 return '<article class="dashboard-booking-card"><div class="dashboard-booking-top"><div><div class="dashboard-booking-ref">'+esc(row.booking_reference)+'</div><div class="dashboard-booking-airline">'+(round?"Round trip":"One way")+'</div></div><span class="dashboard-booking-status '+cls+'">'+label+'</span></div>'+legMarkup(out,"Outbound")+legMarkup(ret,"Return")+'<div class="dashboard-booking-meta"><span><i class="fas fa-users"></i>'+Number(row.adults)+' adult(s), '+Number(row.children)+' child(ren), '+Number(row.infants)+' infant(s)</span><span><i class="fas fa-chair"></i>'+esc(row.cabin_class)+'</span><span><i class="far fa-clock"></i>Requested '+date(row.created_at)+'</span><span><i class="fas fa-rupee-sign"></i>'+money(row.demo_fare)+' demo total</span></div></article>';
}
async function loadCustomerBookings(){
 if(!bookingsList||!currentUser)return;
 const {data,error}=await supabase.from("flight_bookings").select("id,booking_reference,origin,destination,origin_code,destination_code,trip_type,departure_date,return_date,adults,children,infants,cabin_class,airline,flight_number,departure_time,arrival_time,return_airline,return_flight_number,return_departure_time,return_arrival_time,demo_fare,status,created_at").eq("user_id",currentUser.id).order("created_at",{ascending:false});
 if(error){console.error("[Travel Qila] Booking list load failed:",error.code||"unknown");bookingsList.innerHTML='<div class="alert alert-warning mb-0">Your booking requests could not be loaded. Please refresh or contact support.</div>';return;}
 const rows=data||[];if(bookingsCount)bookingsCount.textContent=String(rows.length);
 bookingsList.innerHTML=rows.length?rows.map(renderBooking).join(''):'<div class="dashboard-bookings-empty"><div class="empty-icon"><i class="fas fa-plane"></i></div><h3>No booking requests yet</h3><p>Your submitted flight requests and their status will appear here.</p><a href="services.html" class="btn btn-primary rounded-pill px-4 py-2">Search flights</a></div>';
}
function renderWishlist(row){
 const t=row.itinerary||{},p=t.pricing||{},round=t.tripType==="Round trip";
 const route=esc(t.origin?.label||"")+" → "+esc(t.destination?.label||"");
 const legs=legMarkup(t.outbound,"Outbound")+legMarkup(t.return,"Return");
 const pax=t.passengers||{};
 return '<article class="dashboard-booking-card dashboard-wishlist-card" data-wishlist-card="'+esc(row.id)+'"><div class="dashboard-booking-top"><div><div class="dashboard-booking-ref">SAVED ITINERARY · '+date(row.created_at)+'</div><div class="dashboard-booking-airline">'+route+'</div><div class="small text-muted mt-1">'+(round?"Round trip":"One way")+' · '+date(t.departureDate)+(round?" · Return "+date(t.returnDate):"")+' · '+Number(pax.adults||1)+' adult(s), '+Number(pax.children||0)+' child(ren), '+Number(pax.infants||0)+' infant(s)</div></div><span class="dashboard-booking-status">Saved</span></div>'+legs+'<div class="dashboard-booking-meta"><span><i class="fas fa-chair"></i>'+esc(t.cabin||"Economy")+'</span><span><i class="fas fa-receipt"></i>'+money(p.totalFare)+' illustrative total incl. estimated taxes</span></div><div class="dashboard-wishlist-actions"><button type="button" class="btn btn-primary btn-sm rounded-pill px-3" data-wishlist-book="'+esc(row.id)+'">Request this trip</button><a class="btn btn-outline-primary btn-sm rounded-pill px-3" href="services.html">Review flight options</a><button type="button" class="btn btn-link text-danger btn-sm" data-wishlist-remove="'+esc(row.id)+'">Remove from wishlist</button></div><p class="dashboard-bookings-note mb-0">Saved fare is a demo snapshot, not live availability. The airline must reconfirm fare and taxes before ticketing.</p></article>';
}
async function loadWishlist(){
 if(!wishlistList||!currentUser)return;
 const {data,error}=await supabase.from("flight_wishlists").select("id,title,itinerary,created_at").eq("user_id",currentUser.id).order("created_at",{ascending:false});
 if(error){console.error("[Travel Qila] Wishlist load failed:",error.code||"unknown");wishlistList.innerHTML='<div class="alert alert-warning mb-0">Saved flights could not be loaded. Apply the latest flight-bookings.sql migration, then refresh.</div>';return;}
 const rows=data||[];if(wishlistCount)wishlistCount.textContent=String(rows.length);
 wishlistList.innerHTML=rows.length?rows.map(renderWishlist).join(''):'<div class="dashboard-bookings-empty"><div class="empty-icon"><i class="far fa-heart"></i></div><h3>Your wishlist is empty</h3><p>Save a complete flight itinerary here and pick up where you left off.</p><a href="services.html" class="btn btn-primary rounded-pill px-4 py-2">Find flights</a></div>';
}
async function getUser(){const {data,error}=await supabase.auth.getUser();if(error)throw error;if(!data.user)throw new Error("Your session has expired. Please sign in again.");return data.user;}
async function createBookingFromItinerary(t,user){
 const o=t.outbound,r=t.return,p=t.pricing,s=t;
 if(!o||(s.tripType==="Round trip"&&!r))throw new Error("This saved itinerary is incomplete. Please select both flights again.");
 const payload={user_id:user.id,origin:s.origin.label,destination:s.destination.label,origin_code:s.origin.code||null,destination_code:s.destination.code||null,trip_type:s.tripType,departure_date:s.departureDate,return_date:s.tripType==="Round trip"?s.returnDate:null,adults:s.passengers.adults,children:s.passengers.children,infants:s.passengers.infants,cabin_class:s.cabin,airline:o.airline,flight_number:o.flight,departure_time:o.depart,arrival_time:o.arrive,return_airline:r?.airline||null,return_flight_number:r?.flight||null,return_departure_time:r?.depart||null,return_arrival_time:r?.arrive||null,base_fare:p.baseFare,tax_amount:p.taxAmount,demo_fare:p.totalFare};
 const {data,error}=await supabase.from("flight_bookings").insert(payload).select("booking_reference").single();if(error)throw error;return data.booking_reference;
}
async function handleWishlistActions(event){
 const book=event.target.closest("[data-wishlist-book]"),remove=event.target.closest("[data-wishlist-remove]");
 if(!book&&!remove)return;
 const id=(book||remove).dataset.wishlistBook||(book||remove).dataset.wishlistRemove;
 const card=document.querySelector('[data-wishlist-card="'+CSS.escape(id)+'"]');
 const button=book||remove;if(button.disabled)return;button.disabled=true;
 try{
  if(remove){const {error}=await supabase.from("flight_wishlists").delete().eq("id",id).eq("user_id",currentUser.id);if(error)throw error;await loadWishlist();showMessage("Saved flight removed from your wishlist.","success");return;}
  const {data,error}=await supabase.from("flight_wishlists").select("itinerary").eq("id",id).eq("user_id",currentUser.id).single();if(error)throw error;
  const ref=await createBookingFromItinerary(data.itinerary,currentUser);await loadCustomerBookings();button.textContent="Request sent";showMessage("Booking request "+ref+" was added to My Bookings. Live fare and availability still need confirmation.","success");
 }catch(e){console.error("[Travel Qila] Saved itinerary action failed:",e.code||"unknown");showMessage("We couldn't complete that action. Please refresh and try again.","error");button.disabled=false;}
}
async function initializeDashboard(){
 try{const {data,error}=await supabase.auth.getSession();if(error||!data.session){redirectToLogin();return;}const user=await getUser();currentUser=user;populateProfile(user);await Promise.all([loadCustomerBookings(),loadWishlist()]);}
 catch(e){console.error("[Travel Qila] Dashboard initialization failed.");showMessage("Unable to load your account. Please sign in again.","error");redirectToLogin();}
}
async function handleProfileUpdate(event){
 event.preventDefault();if(!currentUser||isSaving)return;clearMessage();
 const nameInput=profileForm.elements.namedItem("full_name"),phoneInput=profileForm.elements.namedItem("phone"),fullName=nameInput?.value.trim()||"",phone=phoneInput?.value.trim()||"";
 if(fullName.length<2||fullName.length>100||phone.length>30){showMessage("Please check your name and phone number.","error");nameInput?.focus();return;}
 isSaving=true;const button=profileForm.querySelector('button[type="submit"]'),original=button?.innerHTML;if(button){button.disabled=true;button.textContent="Saving…";}
 try{const {data,error}=await supabase.auth.updateUser({data:{...(currentUser.user_metadata||{}),full_name:fullName,phone}});if(error)throw error;if(!data.user)throw new Error("Profile update could not be confirmed.");currentUser=data.user;populateProfile(currentUser);showMessage("Your profile has been updated.","success");}
 catch(e){console.error("[Travel Qila] Profile update failed.");showMessage("We couldn't update your profile. Please try again.","error");}
 finally{isSaving=false;if(button){button.disabled=false;button.innerHTML=original;}}
}
async function handleLogout(){if(logoutButton){logoutButton.disabled=true;logoutButton.textContent="Signing out…";}try{isSigningOut=true;const {error}=await supabase.auth.signOut();if(error)throw error;window.location.replace(authPageUrl("login.html"));}catch(e){isSigningOut=false;showMessage("Unable to sign out. Please try again.","error");if(logoutButton){logoutButton.disabled=false;logoutButton.textContent="Sign Out";}}}
if(profileForm)profileForm.addEventListener("submit",handleProfileUpdate);
if(logoutButton)logoutButton.addEventListener("click",handleLogout);
if(wishlistList)wishlistList.addEventListener("click",handleWishlistActions);
supabase.auth.onAuthStateChange(event=>{if(event==="SIGNED_OUT"&&!isSigningOut)redirectToLogin();});
initializeDashboard();
