export const AIRPORT_MAP = Object.freeze({
  DEL:"New Delhi",BOM:"Mumbai",BLR:"Bengaluru",HYD:"Hyderabad",MAA:"Chennai",
  CCU:"Kolkata",GOI:"Goa",AMD:"Ahmedabad",PNQ:"Pune",COK:"Kochi",JAI:"Jaipur",
  DXB:"Dubai",SIN:"Singapore",BKK:"Bangkok",LHR:"London",DOH:"Doha",AUH:"Abu Dhabi",
  KUL:"Kuala Lumpur",HKT:"Phuket",JFK:"New York"
});

export const FLIGHT_OFFERS = Object.freeze([
  {airline:"IndiGo",flight:"6E 2145",depart:"06:10",duration:135,stops:0,price:6450,baggage:"15 kg check-in"},
  {airline:"Air India",flight:"AI 887",depart:"07:35",duration:150,stops:0,price:7850,baggage:"15 kg check-in"},
  {airline:"Akasa Air",flight:"QP 1320",depart:"09:20",duration:150,stops:0,price:6990,baggage:"15 kg check-in"},
  {airline:"Air India Express",flight:"IX 1042",depart:"11:45",duration:205,stops:1,price:5980,baggage:"15 kg check-in"},
  {airline:"IndiGo",flight:"6E 6087",depart:"13:15",duration:155,stops:0,price:7350,baggage:"15 kg check-in"},
  {airline:"Air India",flight:"AI 441",depart:"16:40",duration:225,stops:1,price:8250,baggage:"25 kg check-in"},
  {airline:"Akasa Air",flight:"QP 1718",depart:"18:30",duration:155,stops:0,price:7590,baggage:"15 kg check-in"},
  {airline:"IndiGo",flight:"6E 9912",depart:"21:15",duration:215,stops:1,price:6250,baggage:"15 kg check-in"}
]);

export function parseAirport(value) {
  const raw = String(value || "").trim();
  const match = raw.match(/\(([A-Za-z]{3})\)\s*$/);
  const code = match ? match[1].toUpperCase() : "";
  const city = raw.replace(/\s*\([A-Za-z]{3}\)\s*$/, "");
  return { city: city || raw, code, label: code ? (AIRPORT_MAP[code] || city) : city };
}

function addMinutes(time, minutes) {
  const [hour, minute] = time.split(":").map(Number);
  const total = (hour * 60 + minute + minutes) % 1440;
  return String(Math.floor(total / 60)).padStart(2, "0") + ":" + String(total % 60).padStart(2, "0");
}

function shiftDate(date, offset) {
  const value = new Date(date + "T12:00:00");
  value.setDate(value.getDate() + offset);
  return value.toISOString().slice(0, 10);
}

export function buildFlightOptions(origin, destination, date, seedText, flexibility = "Exact dates") {
  const seed = seedText.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const offsets = flexibility === "1 day before or after"
    ? [0,-1,1,0,0,0,0,0]
    : flexibility === "3 days before or after" || flexibility === "Flexible - lowest fare matters most"
      ? [0,-1,1,-2,2,-3,3,0]
      : [0,0,0,0,0,0,0,0];
  return FLIGHT_OFFERS.map((offer, index) => {
    const shift = seed % 7;
    const depart = addMinutes(offer.depart, shift * 4);
    const duration = offer.duration + shift * 3 + (index % 2 ? 10 : 0);
    const offset = offsets[index] || 0;
    const price = Math.round((offer.price + (seed % 13) * 175 + (index % 3) * 260 + (offset < 0 ? Math.abs(offset) * -80 : offset * 40)) / 10) * 10;
    return {
      ...offer,
      id: `leg-${seed}-${index}`,
      depart,
      arrive: addMinutes(depart, duration),
      duration,
      price,
      origin,
      destination,
      departureDate: shiftDate(date, offset)
    };
  });
}
