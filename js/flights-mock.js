import { supabase } from "./auth-client.js";

/* Travel Qila flight search: deterministic illustrative data only; no live airline inventory. */
(function () {
  "use strict";
  const form = document.getElementById("flightSearchForm");
  const results = document.getElementById("flightResults");
  if (!form || !results) return;

  const airportMap = {
    DEL:"New Delhi", BOM:"Mumbai", BLR:"Bengaluru", HYD:"Hyderabad", MAA:"Chennai",
    CCU:"Kolkata", GOI:"Goa", AMD:"Ahmedabad", PNQ:"Pune", COK:"Kochi",
    JAI:"Jaipur", DXB:"Dubai", SIN:"Singapore", BKK:"Bangkok", LHR:"London",
    DOH:"Doha", AUH:"Abu Dhabi", KUL:"Kuala Lumpur", HKT:"Phuket", JFK:"New York"
  };
  const sampleOffers = [
    {airline:"IndiGo",code:"6E",flight:"6E 2145",depart:"06:10",arrive:"08:25",duration:135,stops:0,price:6450,baggage:"15 kg check-in",cabin:"Economy"},
    {airline:"Air India",code:"AI",flight:"AI 887",depart:"07:35",arrive:"10:05",duration:150,stops:0,price:7850,baggage:"15 kg check-in",cabin:"Economy"},
    {airline:"Akasa Air",code:"QP",flight:"QP 1320",depart:"09:20",arrive:"11:50",duration:150,stops:0,price:6990,baggage:"15 kg check-in",cabin:"Economy"},
    {airline:"Air India Express",code:"IX",flight:"IX 1042",depart:"11:45",arrive:"15:10",duration:205,stops:1,price:5980,baggage:"15 kg check-in",cabin:"Economy"},
    {airline:"IndiGo",code:"6E",flight:"6E 6087",depart:"13:15",arrive:"15:50",duration:155,stops:0,price:7350,baggage:"15 kg check-in",cabin:"Economy"},
    {airline:"Air India",code:"AI",flight:"AI 441",depart:"16:40",arrive:"20:25",duration:225,stops:1,price:8250,baggage:"25 kg check-in",cabin:"Economy"},
    {airline:"Akasa Air",code:"QP",flight:"QP 1718",depart:"18:30",arrive:"21:05",duration:155,stops:0,price:7590,baggage:"15 kg check-in",cabin:"Economy"},
    {airline:"IndiGo",code:"6E",flight:"6E 9912",depart:"21:15",arrive:"00:50",duration:215,stops:1,price:6250,baggage:"15 kg check-in",cabin:"Economy"}
  ];
  const byId = id => document.getElementById(id);
  const safe = value => String(value == null ? "" : value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
  const money = value => "₹" + Number(value).toLocaleString("en-IN");
  const durationText = minutes => Math.floor(minutes / 60) + "h " + (minutes % 60 ? minutes % 60 + "m" : "");
  const parseAirport = value => {
    const match = String(value).trim().match(/\(([A-Za-z]{3})\)\s*$/);
    const code = match ? match[1].toUpperCase() : "";
    const city = String(value).trim().replace(/\s*\([A-Za-z]{3}\)\s*$/, "");
    return { city: city || value, code, label: code ? (airportMap[code] || city) : city };
  };
  const formatDate = value => {
    if (!value) return "";
    return new Date(value + "T12:00:00").toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
  };
  const addMinutes = (time, minutes) => {
    const parts = time.split(":").map(Number);
    const total = (parts[0] * 60 + parts[1] + minutes) % 1440;
    return String(Math.floor(total / 60)).padStart(2,"0") + ":" + String(total % 60).padStart(2,"0");
  };
  let currentOffers = [];
  let currentSearch = null;

  function updatePriceLabel() {
    const output = byId("priceOutput"), slider = byId("maxPrice");
    if (output && slider) output.textContent = Number(slider.value) >= 200000 ? "₹2,00,000+" : money(slider.value);
  }
  function updateTripType() {
    const isRoundTrip = form.querySelector('input[name="tripType"]:checked').value === "Round trip";
    const wrap = byId("returnDateWrap"), ret = byId("returnDate");
    wrap.hidden = !isRoundTrip;
    ret.required = isRoundTrip;
    if (!isRoundTrip) ret.value = "";
  }
  function buildOffers(search) {
    const routeSeed = (search.origin.code + search.destination.code).split("").reduce((sum,char)=>sum+char.charCodeAt(0),0);
    return sampleOffers.map((offer,index) => {
      const shift = routeSeed % 7;
      const duration = offer.duration + (shift * 3) + (index % 2 ? 10 : 0);
      const price = Math.round((offer.price + (routeSeed % 13) * 175 + (index % 3) * 260) / 10) * 10;
      const outbound={airline:offer.airline,flight:offer.flight,depart:addMinutes(offer.depart,shift*4),arrive:addMinutes(offer.depart,duration),duration,stops:offer.stops,price,origin:search.origin,destination:search.destination,departureDate:search.departureDate};
      const returnSource=sampleOffers[(index+3)%sampleOffers.length];
      const returnShift=(search.destination.code+search.origin.code).split("").reduce((sum,char)=>sum+char.charCodeAt(0),0)%7;
      const returnDuration=returnSource.duration+(returnShift*3)+(index%2?10:0);
      const returnPrice=Math.round((returnSource.price+(returnShift%13)*175+((index+1)%3)*260)/10)*10;
      const returnLeg=search.tripType==="Round trip"?{
        airline:returnSource.airline,flight:returnSource.flight,
        depart:addMinutes(returnSource.depart,returnShift*4),
        arrive:addMinutes(returnSource.depart,returnDuration),duration:returnDuration,
        stops:returnSource.stops,price:returnPrice,
        origin:search.destination,destination:search.origin,departureDate:search.returnDate
      }:null;
      return {...outbound,id:"demo-"+index,returnLeg,totalPrice:price+(returnLeg?returnLeg.price:0)};
    });
  }
  function enquiryLinks(offer) {
    const s=currentSearch;
    const message = [
      "Hello Travel Qila, I would like to enquire about this flight option.",
      "DEMO OPTION — please provide an actual current fare and availability before any booking.",
      "",
      "Airline: "+offer.airline+" ("+offer.flight+")",
      "Route: "+s.origin.label+" ("+(s.origin.code||"")+") to "+s.destination.label+" ("+(s.destination.code||"")+")",
      "Outbound: "+s.origin.label+" ("+(s.origin.code||"")+") to "+s.destination.label+" ("+(s.destination.code||"")+")",
      "Departure: "+formatDate(s.departureDate)+" at "+offer.depart+" · "+offer.airline+" "+offer.flight,
      "Trip type: "+s.tripType,
      s.tripType==="Round trip" ? "Return: "+s.destination.label+" ("+(s.destination.code||"")+") to "+s.origin.label+" ("+(s.origin.code||"")+") on "+formatDate(s.returnDate)+" at "+offer.returnLeg.depart+" · "+offer.returnLeg.airline+" "+offer.returnLeg.flight : "",
      "Passengers: "+s.adults+" adult(s), "+s.children+" child(ren), "+s.infants+" infant(s)",
      "Cabin: "+s.cabin,
      "Illustrative outbound fare: "+money(offer.price)+" per passenger",
      offer.returnLeg ? "Illustrative return fare: "+money(offer.returnLeg.price)+" per passenger" : "",
      "Illustrative total demo fare: "+money(offer.totalPrice)+" per passenger (not a live quote)",
      "",
      "Please check live availability, baggage rules and final fare. I understand this is an enquiry, not a booking."
    ].filter(Boolean).join("\n");
    return {
      whatsapp:"https://wa.me/919871101345?text="+encodeURIComponent(message),
      email:"mailto:info@travelqila.com?subject="+encodeURIComponent("Flight enquiry | "+s.origin.label+" to "+s.destination.label)+"&body="+encodeURIComponent(message)
    };
  }
  function renderOffers() {
    const list=byId("flightResultsList"), empty=byId("flightResultsEmpty"), count=byId("flightResultsCount");
    const stopFilter=byId("resultStops").value, airlineFilter=byId("resultAirline").value, sort=byId("resultSort").value;
    const budget=Number(byId("maxPrice").value);
    let filtered=currentOffers.filter(o=>(stopFilter==="any"||(stopFilter==="nonstop"&&o.stops===0)||(stopFilter==="one"&&o.stops<=1))&&(airlineFilter==="all"||o.airline===airlineFilter)&&o.totalPrice<=budget);
    filtered.sort((a,b)=>sort==="duration"?a.duration-b.duration:sort==="departure"?a.depart.localeCompare(b.depart):a.price-b.price);
    count.textContent=filtered.length+" illustrative options · "+currentOffers.length+" generated for this search · budget applies to total per-passenger trip fare";
    list.innerHTML=filtered.map(offer=>{
      const links=enquiryLinks(offer), stopText=offer.stops===0?"Non-stop":offer.stops+" stop";
      const legMarkup=(leg,title)=>'<div class="flight-leg-heading">'+title+' · '+formatDate(leg.departureDate)+'</div>'+
        '<div class="flight-leg-airline">'+safe(leg.airline)+' · '+safe(leg.flight)+' · '+(leg.stops===0?"Non-stop":leg.stops+" stop")+'</div>'+
        '<div class="flight-route-line"><div><div class="flight-time">'+safe(leg.depart)+'</div><div class="flight-city">'+safe(leg.origin.label)+' ('+safe(leg.origin.code||"—")+')</div></div>'+
        '<div class="flight-route-middle"><div>'+durationText(leg.duration)+'</div><div class="line"></div><div>'+(leg.stops===0?"Non-stop":leg.stops+" stop")+'</div></div>'+
        '<div class="text-end"><div class="flight-time">'+safe(leg.arrive)+'</div><div class="flight-city">'+safe(leg.destination.label)+' ('+safe(leg.destination.code||"—")+')</div></div></div>';
      return '<article class="flight-result-card">'+
        '<div class="flight-result-top"><div class="flight-airline"><div class="flight-airline-mark"><i class="fas fa-plane"></i></div><div><div class="flight-airline-name">'+safe(offer.airline)+'</div><div class="flight-flight-number">'+safe(offer.flight)+' · <span class="flight-demo-chip">Demo itinerary</span></div></div></div>'+
        '<div class="flight-demo-price"><strong>'+money(offer.totalPrice)+'</strong><small>'+(offer.returnLeg?"round-trip demo total":"one-way demo fare")+' / passenger</small></div></div>'+
        legMarkup(offer,"Outbound")+
        (offer.returnLeg?'<div class="flight-return-divider"></div>'+legMarkup(offer.returnLeg,"Return"):"")+
        '<div class="flight-result-meta"><span><i class="fas fa-suitcase"></i>'+safe(offer.baggage)+' (sample)</span><span><i class="fas fa-chair"></i>'+safe(currentSearch.cabin)+'</span><span><i class="fas fa-receipt"></i> Outbound '+money(offer.price)+(offer.returnLeg?' · Return '+money(offer.returnLeg.price):'')+'</span></div>'+
        '<div class="flight-result-actions"><button type="button" class="flight-enquire-wa" data-save-flight="'+offer.id+'"><i class="fas fa-bookmark me-1"></i>Confirm booking request</button><a class="flight-enquire-email" href="'+links.email+'"><i class="far fa-envelope me-1"></i>Email enquiry</a><a class="flight-enquire-email" href="'+links.whatsapp+'" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp me-1"></i>WhatsApp enquiry</a></div><div class="small text-muted mt-2" data-save-status="'+offer.id+'">Saving creates a pending request in your dashboard; it does not issue a ticket.</div></article>';
    }).join("");
    empty.classList.toggle("is-visible",filtered.length===0);
    list.hidden=filtered.length===0;
  }

  form.querySelectorAll('input[name="tripType"]').forEach(el=>el.addEventListener("change",updateTripType));
  byId("departDate").addEventListener("change",function(){byId("returnDate").min=this.value;});
  byId("maxPrice").addEventListener("input",()=>{updatePriceLabel();if(currentSearch)renderOffers();});
  byId("swapCities").addEventListener("click",()=>{const a=byId("origin"),b=byId("destination"),v=a.value;a.value=b.value;b.value=v;});
  ["resultStops","resultAirline","resultSort"].forEach(id=>byId(id).addEventListener("change",renderOffers));

  async function saveFlightRequest(offerId,button) {
    const offer=currentOffers.find(item=>item.id===offerId);
    if(!offer||!currentSearch||button.disabled)return;
    const status=document.querySelector('[data-save-status="'+offerId+'"]');
    const original=button.innerHTML;
    button.disabled=true;button.textContent="Saving request…";
    try {
      const {data:userData,error:userError}=await supabase.auth.getUser();
      if(userError)throw userError;
      if(!userData.user) {
        button.disabled=false;button.innerHTML=original;
        if(status)status.innerHTML='Please <a href="login.html">sign in</a> to save this flight request to your dashboard.';
        return;
      }
      const payload={
        user_id:userData.user.id,origin:currentSearch.origin.label,destination:currentSearch.destination.label,
        origin_code:currentSearch.origin.code||null,destination_code:currentSearch.destination.code||null,
        trip_type:currentSearch.tripType,departure_date:currentSearch.departureDate,
        return_date:currentSearch.tripType==="Round trip"?currentSearch.returnDate:null,
        adults:currentSearch.adults,children:currentSearch.children,infants:currentSearch.infants,
        cabin_class:currentSearch.cabin,airline:offer.airline,flight_number:offer.flight,
        departure_time:offer.depart,arrival_time:offer.arrive,
        return_airline:offer.returnLeg?.airline||null,return_flight_number:offer.returnLeg?.flight||null,
        return_departure_time:offer.returnLeg?.depart||null,return_arrival_time:offer.returnLeg?.arrive||null,
        demo_fare:offer.totalPrice
      };
      const {data,error}=await supabase.from("flight_bookings").insert(payload).select("booking_reference").single();
      if(error)throw error;
      button.textContent="Request saved";button.classList.add("is-saved");
      if(status)status.textContent="Saved to your dashboard · Reference "+data.booking_reference+". Awaiting Travel Qila confirmation.";
    } catch(error) {
      console.error("[Travel Qila] Flight request save failed:",error.code||"unknown");
      button.disabled=false;button.innerHTML=original;
      if(status)status.textContent=(error.code==="42P01"||error.code==="PGRST205")
        ?"Booking storage is not enabled yet. Ask the site administrator to apply supabase/flight-bookings.sql."
        :"We couldn't save this request. Please try again or contact support.";
    }
  }
  results.addEventListener("click",event=>{
    const button=event.target.closest("[data-save-flight]");
    if(button)saveFlightRequest(button.dataset.saveFlight,button);
  });

  form.addEventListener("submit",event=>{
    event.preventDefault();
    updateTripType();
    if(!form.reportValidity())return;
    const origin=parseAirport(byId("origin").value), destination=parseAirport(byId("destination").value);
    if(origin.city.toLowerCase()===destination.city.toLowerCase()||(origin.code&&origin.code===destination.code)){
      byId("destination").setCustomValidity("Choose a different arrival airport.");byId("destination").reportValidity();byId("destination").setCustomValidity("");return;
    }
    const adults=Number(byId("adults").value), infants=Number(byId("infants").value);
    if(infants>adults){byId("infants").setCustomValidity("Infants cannot exceed the number of adults.");byId("infants").reportValidity();byId("infants").setCustomValidity("");return;}
    const tripType=form.querySelector('input[name="tripType"]:checked').value;
    currentSearch={origin,destination,departureDate:byId("departDate").value,returnDate:byId("returnDate").value,tripType,
      adults,children:Number(byId("children").value),infants,cabin:byId("cabin").value};
    currentOffers=buildOffers(currentSearch);
    byId("resultRoute").textContent=origin.label+" ("+(origin.code||"—")+") → "+destination.label+" ("+(destination.code||"—")+")";
    byId("resultDates").textContent=formatDate(currentSearch.departureDate)+(tripType==="Round trip"?" · Return "+formatDate(currentSearch.returnDate):" · One way");
    results.hidden=false;
    renderOffers();
    results.scrollIntoView({behavior:"smooth",block:"start"});
  });
  const now=new Date();now.setMinutes(now.getMinutes()-now.getTimezoneOffset());
  const today=now.toISOString().slice(0,10);
  byId("departDate").min=today;byId("returnDate").min=today;
  updateTripType();updatePriceLabel();
})();