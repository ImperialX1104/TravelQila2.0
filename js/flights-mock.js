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
      return {...offer,id:"demo-"+index,depart:addMinutes(offer.depart,shift*4),arrive:addMinutes(offer.depart,duration),duration,price,
        origin:search.origin,destination:search.destination,departureDate:search.departureDate};
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
      "Departure: "+formatDate(s.departureDate)+" at "+offer.depart,
      "Trip type: "+s.tripType,
      s.tripType==="Round trip" ? "Return date: "+formatDate(s.returnDate) : "",
      "Passengers: "+s.adults+" adult(s), "+s.children+" child(ren), "+s.infants+" infant(s)",
      "Cabin: "+s.cabin,
      "Illustrative demo fare: "+money(offer.price)+" per passenger (not a live quote)",
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
    let filtered=currentOffers.filter(o=>(stopFilter==="any"||(stopFilter==="nonstop"&&o.stops===0)||(stopFilter==="one"&&o.stops<=1))&&(airlineFilter==="all"||o.airline===airlineFilter)&&o.price<=budget);
    filtered.sort((a,b)=>sort==="duration"?a.duration-b.duration:sort==="departure"?a.depart.localeCompare(b.depart):a.price-b.price);
    count.textContent=filtered.length+" illustrative options · "+currentOffers.length+" generated for this search";
    list.innerHTML=filtered.map(offer=>{
      const links=enquiryLinks(offer), stopText=offer.stops===0?"Non-stop":offer.stops+" stop";
      return '<article class="flight-result-card">'+
        '<div class="flight-result-top"><div class="flight-airline"><div class="flight-airline-mark"><i class="fas fa-plane"></i></div><div><div class="flight-airline-name">'+safe(offer.airline)+'</div><div class="flight-flight-number">'+safe(offer.flight)+' · <span class="flight-demo-chip">Demo itinerary</span></div></div></div>'+
        '<div class="flight-demo-price"><strong>'+money(offer.price)+'</strong><small>illustrative / passenger</small></div></div>'+
        '<div class="flight-route-line"><div><div class="flight-time">'+safe(offer.depart)+'</div><div class="flight-city">'+safe(offer.origin.label)+' ('+safe(offer.origin.code||"—")+')</div></div>'+
        '<div class="flight-route-middle"><div>'+durationText(offer.duration)+'</div><div class="line"></div><div>'+stopText+'</div></div>'+
        '<div class="text-end"><div class="flight-time">'+safe(offer.arrive)+'</div><div class="flight-city">'+safe(offer.destination.label)+' ('+safe(offer.destination.code||"—")+')</div></div></div>'+
        '<div class="flight-result-meta"><span><i class="far fa-calendar"></i>'+formatDate(offer.departureDate)+'</span><span><i class="fas fa-suitcase"></i>'+safe(offer.baggage)+' (sample)</span><span><i class="fas fa-chair"></i>'+safe(currentSearch.cabin)+'</span></div>'+
        '<div class="flight-result-actions"><a class="flight-enquire-wa" href="'+links.whatsapp+'" target="_blank" rel="noopener noreferrer"><i class="fab fa-whatsapp me-1"></i>Enquire on WhatsApp</a><a class="flight-enquire-email" href="'+links.email+'"><i class="far fa-envelope me-1"></i>Enquire by email</a></div></article>';
    }).join("");
    empty.classList.toggle("is-visible",filtered.length===0);
    list.hidden=filtered.length===0;
  }

  form.querySelectorAll('input[name="tripType"]').forEach(el=>el.addEventListener("change",updateTripType));
  byId("departDate").addEventListener("change",function(){byId("returnDate").min=this.value;});
  byId("maxPrice").addEventListener("input",()=>{updatePriceLabel();if(currentSearch)renderOffers();});
  byId("swapCities").addEventListener("click",()=>{const a=byId("origin"),b=byId("destination"),v=a.value;a.value=b.value;b.value=v;});
  ["resultStops","resultAirline","resultSort"].forEach(id=>byId(id).addEventListener("change",renderOffers));

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