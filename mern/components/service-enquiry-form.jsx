"use client";

import { useEffect, useState } from "react";

const PACKAGES = {
  "kashmir-escape": { name:"Kashmir Escape", destination:"Kashmir, India" },
  "bali-discovery": { name:"Bali Discovery", destination:"Bali, Indonesia" },
  "dubai-highlights": { name:"Dubai Highlights", destination:"Dubai, UAE" },
  "kerala-backwaters": { name:"Kerala Backwaters", destination:"Kerala, India" },
  "swiss-alpine": { name:"Swiss Alpine Journey", destination:"Switzerland" },
  "thailand-explorer": { name:"Thailand Explorer", destination:"Thailand" }
};
const today = () => {const d=new Date();d.setMinutes(d.getMinutes()-d.getTimezoneOffset());return d.toISOString().slice(0,10);};

export default function ServiceEnquiryForm({ type }) {
  const isVisa=type==="visa";
  const [minDate,setMinDate]=useState("");
  const [packageInfo,setPackageInfo]=useState(null);
  const [fields,setFields]=useState({destination:"",nationality:"Indian",purpose:"",travelDate:"",applicants:"1",stay:"Up to 7 days",urgency:"Standard - please advise",notes:"",fullName:"",email:"",phone:"",departureCity:"",travellers:"",departureDate:"",returnDate:"",budget:"",tripStyle:"",requirements:""});
  const [status,setStatus]=useState("");
  const [whatsapp,setWhatsapp]=useState("");

  useEffect(()=>{
    setMinDate(today());
    if(!isVisa){
      const params=new URLSearchParams(window.location.search);
      const selected=PACKAGES[params.get("package")||""];
      const destination=params.get("destination")||selected?.destination||"";
      setPackageInfo(selected||null);
      setFields(current=>({...current,destination}));
    }
  },[isVisa]);

  function change(event){const {name,value}=event.target;setFields(current=>({...current,[name]:value}));if(name==="departureDate"&&fields.returnDate&&fields.returnDate<value)setFields(current=>({...current,returnDate:""}));}

  function submit(event){
    event.preventDefault();setStatus("");setWhatsapp("");
    const form=event.currentTarget;
    if(!form.reportValidity())return;
    const channel=event.nativeEvent.submitter?.value==="email"?"email":"whatsapp";
    const values=new FormData(form);
    let subject,message;
    if(isVisa){
      subject="Travel Qila - visa assistance enquiry";
      const entries=[["Destination country",values.get("destination")],["Nationality",values.get("nationality")],["Visa category",values.get("purpose")],["Intended travel date",values.get("travelDate")],["Number of applicants",values.get("applicants")],["Planned stay",values.get("stay")],["Application timeline",values.get("urgency")],["Additional details",values.get("notes")||"None"]];
      message="Hello Travel Qila, I would like to request visa assistance.\n\n"+entries.map(([key,value])=>key+": "+value).join("\n")+"\n\nPlease share the applicable document checklist, process, fees and current guidance. I understand visa decisions are made by the relevant authorities.";
    }else{
      subject="Travel Qila holiday enquiry";
      const entries=[["Package",packageInfo?.name||"Custom trip"],["Name",values.get("fullName")],["Email",values.get("email")],["Phone / WhatsApp",values.get("phone")],["Departure city",values.get("departureCity")],["Destination",values.get("destination")],["Travellers",values.get("travellers")],["Departure date",values.get("departureDate")],["Return date",values.get("returnDate")||"Flexible / not specified"],["Budget per person",values.get("budget")||"Not specified"],["Travel style",values.get("tripStyle")||"Not specified"],["Additional requirements",values.get("requirements")||"None"]];
      message="Hello Travel Qila, I would like to request a holiday quotation.\n\n"+entries.map(([key,value])=>key+": "+value).join("\n")+"\n\nPlease contact me to discuss availability and the final quotation. I understand this is an enquiry, not a confirmed booking.";
    }
    if(channel==="email"){
      window.location.href="mailto:info@travelqila.com?subject="+encodeURIComponent(subject)+"&body="+encodeURIComponent(message);
      setStatus("Your email app should open with the enquiry details pre-filled. Please press Send to submit your request.");
    }else{
      const url="https://wa.me/919871101345?text="+encodeURIComponent(message);
      setWhatsapp(url);
      setStatus("WhatsApp should open with your enquiry pre-filled. Please press Send in WhatsApp to submit your request.");
      window.open(url,"_blank","noopener,noreferrer");
    }
  }

  return <section className="enquiry-layout">
    <div className="enquiry-intro"><p className="eyebrow eyebrow-blue">{isVisa?"Travel Qila · Visa assistance":"Travel Qila · Custom trip"}</p><h2>{isVisa?"Where are you planning to travel?":"Request Your Holiday Quotation"}</h2><p>{isVisa?"Tell us about your destination and travel purpose. Our team will help you understand the document checklist, application steps and available assistance.":"Tell us a little about your trip. Our team will follow up to understand your requirements."}</p>{isVisa&&<div className="enquiry-note"><strong>Keep your information safe</strong><span>Share basic trip information. Do not enter passport numbers or upload identity documents in this enquiry form.</span></div>}{packageInfo&&<div className="selected-package"><small>Selected package</small><strong>{packageInfo.name}</strong><span>{packageInfo.destination}</span></div>}</div>
    <form id={isVisa?"visaAssistanceForm":"tripEnquiryForm"} data-service={isVisa?"visa assistance":"trip enquiry"} className="enquiry-form" onSubmit={submit}>
      {isVisa?<div className="enquiry-fields">
        <label>Destination country<input id={isVisa?"visaCountry":"destination"} name="destination" value={fields.destination} onChange={change} placeholder="e.g. Vietnam, UAE, Thailand" required maxLength={100}/></label>
        <label>Nationality<input id="visaNationality" name="nationality" value={fields.nationality} onChange={change} required maxLength={80}/></label>
        <label>Visa category<select id="visaPurpose" name="purpose" value={fields.purpose} onChange={change} required><option value="">Select a category</option>{["Tourist / visitor","Business","Transit","Student","Work","Medical","Not sure - need guidance"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Intended travel date<input id="visaTravelDate" name="travelDate" type="date" min={minDate||undefined} value={fields.travelDate} onChange={change} required/></label>
        <label>Applicants<select id="visaApplicants" name="applicants" value={fields.applicants} onChange={change}>{["1","2","3","4","5","6"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Planned stay<select id="visaStay" name="stay" value={fields.stay} onChange={change}>{["Up to 7 days","8–15 days","16–30 days","31–90 days","Over 90 days","Not decided"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="enquiry-wide">Application timeline<select id="visaUrgency" name="urgency" value={fields.urgency} onChange={change}>{["Standard - please advise","Travel within 7 days","Travel within 15 days","Travel in 1 month or later","Exploring future travel"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="enquiry-wide">Additional details (optional)<textarea id="visaNotes" name="notes" rows="3" maxLength={600} value={fields.notes} onChange={change} placeholder="Previous visa history, questions about documents, or other relevant context (no passport numbers)."/></label>
      </div>:<div className="enquiry-fields">
        <label>Full name<input id="fullName" name="fullName" autoComplete="name" value={fields.fullName} onChange={change} required maxLength={100} placeholder="Your full name"/></label>
        <label>Email address<input id="email" name="email" type="email" autoComplete="email" value={fields.email} onChange={change} required maxLength={150} placeholder="you@example.com"/></label>
        <label>Phone / WhatsApp<input id="phone" name="phone" type="tel" autoComplete="tel" value={fields.phone} onChange={change} required maxLength={20} pattern="[0-9+() .-]{7,20}" placeholder="+91 98765 43210"/></label>
        <label>Departure city<input id="departureCity" name="departureCity" value={fields.departureCity} onChange={change} required maxLength={100} placeholder="e.g. New Delhi"/></label>
        <label className="enquiry-wide">Destination<input id="destination" name="destination" value={fields.destination} onChange={change} required maxLength={120} placeholder="Where would you like to go?"/></label>
        <label>Travellers<select id="travellers" name="travellers" value={fields.travellers} onChange={change} required><option value="">Select travellers</option>{["1","2","3","4","5","6","7","8","9","10+"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label>Departure date<input id="departureDate" name="departureDate" type="date" min={minDate||undefined} value={fields.departureDate} onChange={change} required/></label>
        <label>Return date<input id="returnDate" name="returnDate" type="date" min={fields.departureDate||minDate||undefined} value={fields.returnDate} onChange={change}/></label>
        <label>Approximate budget per person<select id="budget" name="budget" value={fields.budget} onChange={change}><option value="">Not decided</option>{["Below ₹25,000","₹25,000–₹50,000","₹50,000–₹1,00,000","₹1,00,000–₹2,00,000","Above ₹2,00,000"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="enquiry-wide">Travel style<select id="tripStyle" name="tripStyle" value={fields.tripStyle} onChange={change}><option value="">Please select</option>{["Family holiday","Honeymoon / couple","Friends / group","Solo travel","Corporate / MICE","Other"].map(x=><option key={x}>{x}</option>)}</select></label>
        <label className="enquiry-wide">Additional requirements<textarea id="requirements" name="requirements" rows="3" maxLength={1500} value={fields.requirements} onChange={change} placeholder="Destination preferences, sightseeing interests, children’s ages, or anything else we should know."/></label>
      </div>}
      {!isVisa&&<input type="hidden" id="packageId" name="packageId" value={new URLSearchParams(typeof window!=="undefined"?window.location.search:"").get("package")||""}/>}\n      <div className="enquiry-actions"><button className="button" type="submit" value="whatsapp">Send on WhatsApp ↗</button><button className="button button-outline" type="submit" value="email">Send by email</button></div>
      {status&&<p id="submissionMessage" className="enquiry-status" role="status">{status} {whatsapp&&<a id="whatsappFallback" href={whatsapp} target="_blank" rel="noopener noreferrer">Open WhatsApp</a>}</p>}
      {isVisa&&<p className="enquiry-disclaimer">Visa decisions are made by the relevant embassy, consulate or immigration authority. Requirements, fees and processing times can change; no approval or processing time is guaranteed.</p>}
    </form>
  </section>;
}
