"use client";
import {useState} from "react";
export default function ContactEnquiry(){
 const [fields,setFields]=useState({Name:"",Email:"", "Phone / WhatsApp":"",Subject:"",Message:""});
 const [status,setStatus]=useState("");
 function change(e){setFields(v=>({...v,[e.target.name]:e.target.value}));}
 function submit(e){e.preventDefault();setStatus("");const channel=e.nativeEvent.submitter?.value==="email"?"email":"whatsapp";const message="Hello Travel Qila, I have a query.\n\n"+Object.entries(fields).filter(([,v])=>v.trim()).map(([k,v])=>k+": "+v.trim()).join("\n");if(channel==="email"){window.location.href="mailto:info@travelqila.com?subject="+encodeURIComponent("Travel Qila website enquiry: "+fields.Subject)+"&body="+encodeURIComponent(message);setStatus("Your email app should open with the enquiry pre-filled. Please press Send to submit it.");}else{const url="https://wa.me/919871101345?text="+encodeURIComponent(message);window.open(url,"_blank","noopener,noreferrer");setStatus("WhatsApp should open with the enquiry pre-filled. Please press Send in WhatsApp to submit it.");}}
 return <form id="contactEnquiryForm" className="contact-form" onSubmit={submit}>
  <div className="contact-fields">
   <label>Your name *<input name="Name" value={fields.Name} onChange={change} required maxLength={100} autoComplete="name" placeholder="Your name"/></label>
   <label>Your email *<input name="Email" type="email" value={fields.Email} onChange={change} required maxLength={150} autoComplete="email" placeholder="you@example.com"/></label>
   <label>Phone / WhatsApp<input name="Phone / WhatsApp" type="tel" value={fields["Phone / WhatsApp"]} onChange={change} maxLength={20} pattern="[0-9+() .-]{7,20}" autoComplete="tel" placeholder="+91 98765 43210"/></label>
   <label>Subject *<input name="Subject" value={fields.Subject} onChange={change} required maxLength={150} placeholder="How can we help?"/></label>
   <label className="contact-wide">Message *<textarea name="Message" value={fields.Message} onChange={change} required maxLength={2000} rows="6" placeholder="Tell us how we can help you."/></label>
  </div>
  <div className="contact-actions"><button className="button" type="submit" value="whatsapp">Send via WhatsApp ↗</button><button className="button button-outline" type="submit" value="email">Send by email</button></div>
  {status&&<p id="contactFormStatus" className="contact-status" role="status">{status}</p>}
 </form>;
}
