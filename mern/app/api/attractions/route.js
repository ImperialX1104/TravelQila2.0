import { NextResponse } from "next/server";

const DESTINATIONS = {
  "kashmir-escape": { lat: 34.0837, lon: 74.7973 },
  "bali-discovery": { lat: -8.5069, lon: 115.2625 },
  "dubai-highlights": { lat: 25.2048, lon: 55.2708 },
  "kerala-backwaters": { lat: 9.4981, lon: 76.3388 },
  "swiss-alpine": { lat: 46.6863, lon: 7.8632 },
  "thailand-explorer": { lat: 7.8804, lon: 98.3923 }
};
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000;

async function requestAttractions(key, params) {
  const cached = cache.get(key);
  if (cached && cached.expires > Date.now()) return cached.value;
  const base = process.env.TRAVEL_ATTRACTIONS_URL ||
    (process.env.NEXT_PUBLIC_SUPABASE_URL ? process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/,"") + "/functions/v1/travel-attractions" : "");
  if (!base) throw new Error("Attraction service is not configured.");
  const target = new URL(base);
  Object.entries(params).forEach(([name,value])=>target.searchParams.set(name,String(value)));
  const response = await fetch(target,{signal:AbortSignal.timeout(8000),next:{revalidate:3600}});
  if (!response.ok) throw new Error("Attraction provider returned an error.");
  const result = await response.json();
  if (!result || result.success !== true) throw new Error("Attraction provider returned an invalid response.");
  cache.set(key,{value:result,expires:Date.now()+CACHE_TTL});
  return result;
}

export async function GET(request) {
  const url = new URL(request.url);
  const action = url.searchParams.get("action") || "search";
  try {
    if (action === "search") {
      const packageId = url.searchParams.get("packageId") || "";
      const destination = DESTINATIONS[packageId];
      if (!destination) return NextResponse.json({error:"Unknown package destination."},{status:400});
      const result = await requestAttractions("search:"+packageId,{
        action:"search",lat:destination.lat,lon:destination.lon,radius:15000,limit:10
      });
      if (!Array.isArray(result.places)) throw new Error("Attraction provider returned invalid place data.");
      return NextResponse.json({success:true,places:result.places.slice(0,10)},{headers:{"Cache-Control":"public, s-maxage=3600, stale-while-revalidate=86400"}});
    }
    if (action === "details") {
      const xid = url.searchParams.get("xid") || "";
      if (!/^[A-Za-z0-9_-]{1,80}$/.test(xid)) return NextResponse.json({error:"Invalid attraction identifier."},{status:400});
      const result = await requestAttractions("details:"+xid,{action:"details",xid});
      if (!result.place || typeof result.place !== "object") throw new Error("Attraction details are unavailable.");
      return NextResponse.json({success:true,place:result.place},{headers:{"Cache-Control":"public, s-maxage=86400, stale-while-revalidate=604800"}});
    }
    return NextResponse.json({error:"Unsupported attraction action."},{status:400});
  } catch {
    return NextResponse.json({error:"Attraction information is temporarily unavailable."},{status:503});
  }
}
