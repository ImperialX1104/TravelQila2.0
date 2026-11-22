"use client";

import { useState } from "react";

export default function ServiceEnquiryForm({ type, minDate, initialDestination = "", initialPackage = null }) {
  const isVisa = type === "visa";
  const [fields,setFields] = useState({
    destination: initialDestination, nationality: "Indian", purpose: "", travelDate: "",
    applicants: "1", stay: "Up to 7 days", urgency: "Standard - please advise", notes: "",
    fullName: "", email: "", phone: "", departureCity: "", travellers: "",
    departureDate: "", returnDate: "", budget: "", tripStyle: "", requirements: ""
  });
  const [status,setStatus] = useState("");
  const [whatsapp,setWhatsapp] = useState("");

  function change(event) {
    const {name,value} = event.target;
    setFields(current => ({...current,[name]:value}));
    if (name === "departureDate" && fields.returnDate && fields.returnDate < value) {
      setFields(current => ({...current,returnDate:""}));
    }
  }

  function submit(event) {
    event.preventDefault();
    setStatus("");
    setWhatsapp("");
    const form = event.currentTarget;
    if (!form.reportValidity()) return;
    const channel = event.nativeEvent.submitter?.value === "email" ? "email" : "whatsapp";
    const values = new FormData(form);
    let subject;
    let message;
    if (isVisa) {
      subject = "Travel Qila - visa assistance enquiry";
      const entries = [
        ["Destination country",values.get("destination")],["Nationality",values.get("nationality")],
        ["Visa category",values.get("purpose")],["Intended travel date",values.get("travelDate")],
        ["Number of applicants",values.get("applicants")],["Planned stay",values.get("stay")],
        ["Application timeline",values.get("urgency")],["Additional details",values.get("notes")||"None"]
      ];
      message = "Hello Travel Qila, I would like to request visa assistance.\n\n" +
        entries.map(([key,value])=>key+": "+value).join("\n") +
        "\n\nPlease share the applicable document checklist, process, fees and current guidance. I understand visa decisions are made by the relevant authorities.";
    } else {
      subject = "Travel Qila holiday enquiry";
      const entries = [
        ["Package",initialPackage?.name||"Custom trip"],["Name",values.get("fullName")],
        ["Email",values.get("email")],["Phone / WhatsApp",values.get("phone")],
        ["Departure city",values.get("departureCity")],["Destination",values.get("destination")],
        ["Travellers",values.get("travellers")],["Departure date",values.get("departureDate")],
        ["Return date",values.get("returnDate")||"Flexible / not specified"],
        ["Budget per person",values.get("budget")||"Not specified"],
        ["Travel style",values.get("tripStyle")||"Not specified"],
        ["Additional requirements",values.get("requirements")||"None"]
      ];
      message = "Hello Travel Qila, I would like to request a holiday quotation.\n\n" +
        entries.map(([key,value])=>key+": "+value).join("\n") +
        "\n\nPlease contact me to discuss availability and the final quotation. I understand this is an enquiry, not a confirmed booking.";
    }
    if (channel === "email") {
      window.open("mailto:info@travelqila.com?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(message),"_self");
      setStatus("Your email app should open with the enquiry pre-filled. Please press Send to submit it.");
    } else {
      const url = "https://wa.me/919871101345?text="+encodeURIComponent(message);
      setWhatsapp(url);
      window.open(url,"_blank","noopener,noreferrer");
      setStatus("WhatsApp should open with the enquiry pre-filled. Please press Send in WhatsApp to submit it.");
    }
  }

  return <div className="enquiry-card">
    {initialPackage && <div className="enquiry-package"><span>Selected package</span><strong>{initialPackage.name}</strong><small>{initialPackage.destination}</small></div>}
    <form id={isVisa?"visaAssistanceForm":"tripEnquiryForm"} data-service={isVisa?"visa assistance":"trip enquiry"} className="enquiry-form service-enquiry-form" onSubmit={submit}>
      {isVisa ? <>
        <div className="enquiry-form-heading"><p className="eyebrow eyebrow-blue">Visa application support</p><h2>Tell us about your travel plans</h2><p>Share a few details so our team can guide you on the next steps. Visa rules and decisions remain with the relevant authorities.</p></div>
        <div className="enquiry-fields">
          <label>Destination country *<input id="visaCountry" name="destination" value={fields.destination} onChange={change} required maxLength={100} placeholder="e.g. United Kingdom"/></label>
          <label>Your nationality *<input id="visaNationality" name="nationality" value={fields.nationality} onChange={change} required maxLength={60}/></label>
          <label>Visa category *<select id="visaPurpose" name="purpose" value={fields.purpose} onChange={change} required><option value="">Choose visa category</option><option>Tourist / Visitor</option><option>Business</option><option>Student</option><option>Transit</option><option>Work</option><option>Other / Not sure</option></select></label>
          <label>Intended travel date *<input id="visaTravelDate" name="travelDate" type="date" min={minDate} data-min-today required value={fields.travelDate} onChange={change}/></label>
          <label>Number of applicants *<select id="visaApplicants" name="applicants" value={fields.applicants} onChange={change}>{Array.from({length:10},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></label>
          <label>Planned stay<select id="visaStay" name="stay" value={fields.stay} onChange={change}><option>Up to 7 days</option><option>8–15 days</option><option>16–30 days</option><option>31–90 days</option><option>More than 90 days</option></select></label>
          <label>Application timeline<select id="visaUrgency" name="urgency" value={fields.urgency} onChange={change}><option>Standard - please advise</option><option>Travel within 30 days</option><option>Travel within 60 days</option><option>Travel later</option></select></label>
          <label className="enquiry-wide">Additional details<textarea id="visaNotes" name="notes" rows="3" maxLength={1000} value={fields.notes} onChange={change} placeholder="Previous visa history, planned itinerary or questions"/></label>
        </div>
      </> : <>
        <div className="enquiry-form-heading"><p className="eyebrow eyebrow-blue">Your holiday enquiry</p><h2>Build your trip with us</h2><p>Share your travel preferences and our team will help shape the next steps.</p></div>
        <input type="hidden" id="packageId" name="packageId" value={initialPackage?.id||""}/>
        <div className="enquiry-fields">
          <label>Full name *<input id="fullName" name="fullName" autoComplete="name" required maxLength={100} value={fields.fullName} onChange={change}/></label>
          <label>Email address *<input id="email" name="email" type="email" autoComplete="email" required maxLength={150} value={fields.email} onChange={change}/></label>
          <label>Phone / WhatsApp *<input id="phone" name="phone" type="tel" autoComplete="tel" required maxLength={20} pattern="[0-9+() .-]{7,20}" value={fields.phone} onChange={change}/></label>
          <label>Departure city *<input id="departureCity" name="departureCity" required maxLength={100} value={fields.departureCity} onChange={change}/></label>
          <label>Destination *<input id="destination" name="destination" required maxLength={120} value={fields.destination} onChange={change}/></label>
          <label>Travellers *<select id="travellers" name="travellers" required value={fields.travellers} onChange={change}><option value="">Select travellers</option>{Array.from({length:20},(_,i)=><option key={i} value={i+1}>{i+1}</option>)}</select></label>
          <label>Departure date *<input id="departureDate" name="departureDate" type="date" min={minDate} data-min-today required value={fields.departureDate} onChange={change}/></label>
          <label>Return date<input id="returnDate" name="returnDate" type="date" min={fields.departureDate||minDate} data-min-today value={fields.returnDate} onChange={change}/></label>
          <label>Budget per person<select id="budget" name="budget" value={fields.budget} onChange={change}><option value="">Choose budget</option><option>Under ₹25,000</option><option>₹25,000–₹50,000</option><option>₹50,000–₹1,00,000</option><option>₹1,00,000–₹2,00,000</option><option>Above ₹2,00,000</option><option>Flexible</option></select></label>
          <label>Travel style<select id="tripStyle" name="tripStyle" value={fields.tripStyle} onChange={change}><option value="">Choose travel style</option><option>Family holiday</option><option>Couple / honeymoon</option><option>Friends / group</option><option>Adventure</option><option>Culture & sightseeing</option><option>Relaxation</option><option>Business</option></select></label>
          <label className="enquiry-wide">Additional requirements<textarea id="requirements" name="requirements" rows="3" maxLength={1200} value={fields.requirements} onChange={change} placeholder="Hotel preferences, activities, accessibility or other details"/></label>
        </div>
      </>}
      <div className="enquiry-actions"><button className="button" type="submit" value="whatsapp">Send via WhatsApp ↗</button><button className="button button-outline" type="submit" value="email">Send by email</button></div>
      {status&&<p id="submissionMessage" data-form-status className="enquiry-status" role="status">{status}</p>}
      {whatsapp&&<a id="whatsappFallback" className="enquiry-whatsapp" href={whatsapp} target="_blank" rel="noopener noreferrer">Continue in WhatsApp ↗</a>}
    </form>
  </div>;
}
