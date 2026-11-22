"use client";

import { useState } from "react";
import Link from "next/link";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const money = value => "₹" + Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 });
const date = value => {
  if (!value) return "Date to be confirmed";
  const parsed = new Date(value + (String(value).length === 10 ? "T12:00:00" : ""));
  return Number.isNaN(parsed.getTime()) ? "Date to be confirmed" : parsed.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};
const memberDate = value => value ? new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Not available";

function FlightLeg({ leg, label }) {
  if (!leg) return null;
  return <div className="dash-leg">
    <div className="dash-leg-title">{label} · {date(leg.departureDate || leg.departure_date)}</div>
    <div className="dash-leg-grid">
      <div><strong>{leg.origin?.label || leg.origin || ""}</strong><small>{leg.origin?.code || leg.origin_code || ""}</small><b>{leg.depart || leg.departure_time || ""}</b></div>
      <span className="dash-route-arrow" aria-hidden="true">→</span>
      <div className="dash-leg-end"><strong>{leg.destination?.label || leg.destination || ""}</strong><small>{leg.destination?.code || leg.destination_code || ""}</small><b>{leg.arrive || leg.arrival_time || ""}</b></div>
    </div>
    <p>{leg.airline} · {leg.flight || leg.flight_number}</p>
  </div>;
}

export default function DashboardClient({ user, initial, loadErrors }) {
  const [profile, setProfile] = useState({ full_name: user.metadata.full_name || user.metadata.name || "", phone: user.metadata.phone || "" });
  const [message, setMessage] = useState({ text: "", kind: "info" });
  const [busy, setBusy] = useState("");
  const [bookings, setBookings] = useState(initial.bookings);
  const [wishlist, setWishlist] = useState(initial.wishlist);
  const [hotelWishlist, setHotelWishlist] = useState(initial.hotelWishlist);
  const [hotelBookings] = useState(initial.hotelBookings);
  const [errors] = useState(loadErrors);
  const [active, setActive] = useState("overview");

  async function updateProfile(event) {
    event.preventDefault();
    const fullName = profile.full_name.trim();
    const phone = profile.phone.trim();
    if (fullName.length < 2 || fullName.length > 100 || phone.length > 30) {
      setMessage({ text: "Please check your name and phone number.", kind: "error" });
      return;
    }
    setBusy("profile");
    try {
      const { data, error } = await getSupabaseBrowserClient().auth.updateUser({ data: { ...user.metadata, full_name: fullName, phone } });
      if (error || !data.user) throw error || new Error("Profile update could not be confirmed.");
      setMessage({ text: "Your profile has been updated.", kind: "success" });
    } catch {
      setMessage({ text: "We couldn't update your profile. Please try again.", kind: "error" });
    } finally { setBusy(""); }
  }

  async function signOut() {
    setBusy("logout");
    const { error } = await getSupabaseBrowserClient().auth.signOut();
    if (error) {
      setMessage({ text: "Unable to sign out. Please try again.", kind: "error" });
      setBusy("");
      return;
    }
    window.location.replace("/login.html");
  }

  async function removeFlight(id) {
    setBusy(id);
    try {
      const { error } = await getSupabaseBrowserClient().from("flight_wishlists").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      setWishlist(rows => rows.filter(row => row.id !== id));
      setMessage({ text: "Saved flight removed from your wishlist.", kind: "success" });
    } catch {
      setMessage({ text: "We couldn't remove this saved flight. Please try again.", kind: "error" });
    } finally { setBusy(""); }
  }

  async function requestFlight(id) {
    setBusy(id);
    try {
      const response = await fetch("/api/flight-bookings/from-wishlist", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wishlistId: id })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Request failed");
      const { data, error } = await getSupabaseBrowserClient().from("flight_bookings").select("id,booking_reference,origin,destination,origin_code,destination_code,trip_type,departure_date,return_date,adults,children,infants,cabin_class,additional_preferences,airline,flight_number,departure_time,arrival_time,return_airline,return_flight_number,return_departure_time,return_arrival_time,demo_fare,status,created_at").eq("booking_reference", result.bookingReference).eq("user_id", user.id).single();
      if (error) throw error;
      setBookings(rows => [data, ...rows]);
      setMessage({ text: `Booking request ${result.bookingReference} was added to My Bookings. Live fare and availability still need confirmation.`, kind: "success" });
    } catch (error) {
      setMessage({ text: error.message === "This saved itinerary is incomplete." ? error.message : "We couldn't complete that action. Please refresh and try again.", kind: "error" });
    } finally { setBusy(""); }
  }

  async function removeHotel(id) {
    setBusy(id);
    try {
      const { error } = await getSupabaseBrowserClient().from("hotel_wishlists").delete().eq("id", id).eq("user_id", user.id);
      if (error) throw error;
      setHotelWishlist(rows => rows.filter(row => row.id !== id));
      setMessage({ text: "Hotel removed from your wishlist.", kind: "success" });
    } catch {
      setMessage({ text: "Unable to remove this hotel. Please try again.", kind: "error" });
    } finally { setBusy(""); }
  }

  const name = profile.full_name || "Traveller";
  const nav = [["overview","Overview"],["bookings","My bookings"],["flights","Saved flights"],["hotels","Hotel activity"],["profile","My profile"]];

  return <div className="container dashboard-layout">
    <aside className="dashboard-sidebar">
      <div className="dashboard-user"><span>{name.slice(0,1).toUpperCase()}</span><strong>{name}</strong><small>{user.email}</small></div>
      <p className="dash-side-label">My account</p>
      {nav.map(([key,label]) => <button key={key} className={active === key ? "is-active" : ""} onClick={() => setActive(key)}>{label}</button>)}
      <a className="dash-wishlist-anchor" data-wishlist-list href="#wishlist" onClick={() => setActive("flights")}>Saved flights</a>
      <button className="dash-logout" onClick={signOut} disabled={busy === "logout"}>{busy === "logout" ? "Signing out…" : "Sign out"}</button>
    </aside>

    <section className="dashboard-content">
      <div className="dashboard-heading"><div><p className="eyebrow eyebrow-blue">Your Travel Qila account</p><h1>{active === "overview" ? `Welcome, ${name}` : nav.find(item => item[0] === active)?.[1]}</h1><p>Manage your profile, travel requests and saved ideas in one place.</p></div><Link className="button button-small" href="/trip-enquiry.html">Plan a trip</Link></div>
      {message.text && <div className={`dash-message is-${message.kind}`} role={message.kind === "error" ? "alert" : "status"}>{message.text}</div>}

      {active === "overview" && <div className="dash-overview">
        <div className="dash-stat-grid"><article><span>Flight requests</span><strong>{bookings.length}</strong></article><article><span>Saved flights</span><strong>{wishlist.length}</strong></article><article><span>Saved hotels</span><strong>{hotelWishlist.length}</strong></article></div>
        <div className="dash-welcome"><div><h2>Your next journey starts here.</h2><p>Search flights, explore stays or ask our team to build a holiday around your plans.</p></div><div className="dash-quick-links"><Link href="/services.html">Find flights ↗</Link><Link href="/hotels.html">Explore hotels ↗</Link><Link href="/packages.html">Browse packages ↗</Link></div></div>
        <h2 className="dash-section-title" data-bookings-list>Recent flight requests</h2>
        {bookings.slice(0,2).map(row => <BookingCard key={row.id} row={row} />)}
        {!bookings.length && <EmptyState title="No booking requests yet" text="Your submitted flight requests will appear here." href="/services.html" action="Search flights" />}
      </div>}

      {active === "bookings" && <section data-bookings-list><h2 className="dash-section-title">Flight booking requests</h2>{errors.bookings && <DataError text="Your booking requests could not be loaded. Please refresh or contact support." />}{bookings.map(row => <BookingCard key={row.id} row={row} />)}{!errors.bookings && !bookings.length && <EmptyState title="No booking requests yet" text="Your submitted flight requests and their status will appear here." href="/services.html" action="Search flights" />}</section>}

      {active === "flights" && <section id="wishlist" data-wishlist-list><h2 className="dash-section-title">Saved flight itineraries</h2>{errors.wishlist && <DataError text="Saved flights could not be loaded. Apply the latest flight-bookings.sql migration, then refresh." />}{wishlist.map(row => <article className="dash-card" key={row.id}><div className="dash-card-top"><div><small>Saved itinerary · {date(row.created_at)}</small><h3>{row.itinerary?.origin?.label} → {row.itinerary?.destination?.label}</h3><p>{row.itinerary?.tripType} · {date(row.itinerary?.departureDate)} · {row.itinerary?.passengers?.adults || 1} adult(s)</p></div><span className="dash-status">Saved</span></div><FlightLeg leg={row.itinerary?.outbound} label="Outbound" /><FlightLeg leg={row.itinerary?.return} label="Return" /><p className="dash-disclaimer">Saved fare is an illustrative demo snapshot, not live availability. Final fare and taxes require airline confirmation.</p><div className="dash-card-actions"><button className="button button-small" onClick={() => requestFlight(row.id)} disabled={busy === row.id}>{busy === row.id ? "Please wait…" : "Request this trip"}</button><Link href={`/services.html?wishlistId=${encodeURIComponent(row.id)}`}>Recheck options</Link><button className="dash-text-danger" onClick={() => removeFlight(row.id)} disabled={busy === row.id}>Remove</button></div></article>)}{!errors.wishlist && !wishlist.length && <EmptyState title="Your wishlist is empty" text="Save a complete flight itinerary and pick up where you left off." href="/services.html" action="Find flights" />}</section>}

      {active === "hotels" && <section><h2 className="dash-section-title">Hotel wishlist</h2>{errors.hotelWishlist && <DataError text="Hotel wishlist is temporarily unavailable. Apply the hotel-bookings.sql migration and refresh." />}{hotelWishlist.map(row => <article className="dash-card hotel-dash-card" key={row.id}><div><h3>{row.hotel_name}</h3><p>{row.destination} · {row.star_rating}-star</p><p>{date(row.check_in)} – {date(row.check_out)} · {row.guests} guests</p><strong>{money(row.total_price)} <small>estimated total incl. taxes</small></strong></div><button className="dash-text-danger" onClick={() => removeHotel(row.id)} disabled={busy === row.id}>Remove</button></article>)}{!errors.hotelWishlist && !hotelWishlist.length && <EmptyState title="No saved hotels yet" text="Explore stays and save your favourites here." href="/hotels.html" action="Explore stays" />}<h2 className="dash-section-title dash-spaced">Hotel booking enquiries</h2>{errors.hotelBookings && <DataError text="Hotel requests could not be loaded. Apply the hotel-bookings.sql migration and refresh." />}{hotelBookings.map(row => <article className="dash-card hotel-dash-card" key={row.id}><div><h3>{row.hotel_name}</h3><p>{row.destination} · {date(row.check_in)} – {date(row.check_out)} · {row.guests} guests</p><p>Request #{String(row.id).slice(0,8).toUpperCase()} · Submitted {date(row.created_at)}</p><strong>{money(row.total_price)} <small>estimated incl. taxes</small></strong></div><span className="dash-status">{String(row.status || "enquiry received").replace(/_/g," ")}</span></article>)}{!errors.hotelBookings && !hotelBookings.length && <p className="dash-empty-inline">No hotel booking requests yet.</p>}</section>}

      {active === "profile" && <section className="dash-profile-card"><h2>Account details</h2><div className="dash-profile-summary"><span>{name}</span><div><strong>{user.email || "Not available"}</strong><small>Member since {memberDate(user.createdAt)}</small></div></div><form onSubmit={updateProfile}><label>Full name<input value={profile.full_name} onChange={e => setProfile(p => ({...p,full_name:e.target.value}))} minLength={2} maxLength={100} required /></label><label>Phone number<input value={profile.phone} onChange={e => setProfile(p => ({...p,phone:e.target.value}))} maxLength={30} /></label><button className="button" type="submit" disabled={busy === "profile"}>{busy === "profile" ? "Saving…" : "Save changes"}</button></form></section>}
    </section>
  </div>;
}

function BookingCard({ row }) {
  const round = row.trip_type === "Round trip";
  return <article className="dash-card"><div className="dash-card-top"><div><small>{row.booking_reference}</small><h3>{row.trip_type} · {row.origin} → {row.destination}</h3></div><span className={`dash-status ${row.status === "confirmed" ? "is-confirmed" : row.status === "cancelled" ? "is-cancelled" : ""}`}>{row.status === "confirmed" ? "Confirmed" : row.status === "cancelled" ? "Cancelled" : "Pending confirmation"}</span></div><FlightLeg leg={{ airline: row.airline, flight: row.flight_number, depart: row.departure_time, arrive: row.arrival_time, origin: row.origin, destination: row.destination, departureDate: row.departure_date }} label="Outbound" />{round && <FlightLeg leg={{ airline: row.return_airline, flight: row.return_flight_number, depart: row.return_departure_time, arrive: row.return_arrival_time, origin: row.destination, destination: row.origin, departureDate: row.return_date }} label="Return" />}<div className="dash-meta">{row.adults} adult(s) · {row.children} child(ren) · {row.infants} infant(s) · {row.cabin_class} · Requested {date(row.created_at)} · {money(row.demo_fare)} demo total</div>{row.additional_preferences && <p className="dash-disclaimer">Preferences: {row.additional_preferences}</p>}</article>;
}
function EmptyState({ title, text, href, action }) { return <div className="dash-empty"><h3>{title}</h3><p>{text}</p><Link href={href}>{action} →</Link></div>; }
function DataError({ text }) { return <div className="dash-data-error" role="alert">{text}</div>; }
