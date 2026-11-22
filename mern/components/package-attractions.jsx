"use client";

import {useEffect,useState} from "react";

function distanceLabel(value) {
  const distance = Number(value);
  if (!Number.isFinite(distance)) return "Distance unavailable";
  return distance < 1000 ? Math.round(distance)+" m away" : (distance/1000).toFixed(1)+" km away";
}
function categoryLabel(kinds) {
  if (!kinds) return "Attraction";
  return String(kinds).split(",").slice(0,3).map(value=>value.replace(/_/g," ").replace(/\b\w/g,char=>char.toUpperCase())).join(" · ");
}

export default function PackageAttractions({packageId}) {
  const [places,setPlaces] = useState([]);
  const [status,setStatus] = useState("Loading nearby attractions…");
  const [open,setOpen] = useState({});
  const [details,setDetails] = useState({});
  const [loading,setLoading] = useState({});

  useEffect(()=>{
    const controller = new AbortController();
    fetch("/api/attractions?packageId="+encodeURIComponent(packageId),{signal:controller.signal})
      .then(async response=>{
        const result=await response.json();
        if(!response.ok||!result.success||!Array.isArray(result.places))throw new Error(result.error||"Attraction information is unavailable.");
        setPlaces(result.places.slice(0,10));
        setStatus(result.places.length?"":"No nearby attractions were found.");
      })
      .catch(error=>{
        if(error.name!=="AbortError")setStatus("Attraction information is temporarily unavailable. Please try again later.");
      });
    return ()=>controller.abort();
  },[packageId]);

  async function toggleDetails(place) {
    const xid=place.xid;
    if(!xid)return;
    if(open[xid]){setOpen(current=>({...current,[xid]:false}));return;}
    setOpen(current=>({...current,[xid]:true}));
    if(details[xid])return;
    setLoading(current=>({...current,[xid]:true}));
    try{
      const response=await fetch("/api/attractions?action=details&xid="+encodeURIComponent(xid));
      const result=await response.json();
      if(!response.ok||!result.success||!result.place)throw new Error("Details are unavailable.");
      const placeDetails=result.place;
      const description=placeDetails.wikipedia_extracts?.text||placeDetails.info?.descr||placeDetails.description||"Additional description is unavailable.";
      setDetails(current=>({...current,[xid]:description}));
    }catch{
      setDetails(current=>({...current,[xid]:{description:"Unable to load details. Please try again.",website:null}}));
    }finally{
      setLoading(current=>({...current,[xid]:false}));
    }
  }

  return <section className="package-attractions" aria-labelledby="attractionsTitle">
    <div className="package-section-heading"><p className="eyebrow eyebrow-blue">Explore nearby places</p><h2 id="attractionsTitle">Explore Attractions <em>Nearby.</em></h2><p id="attractionsSubtitle">Discover interesting places around your destination.</p></div>
    {status?<p id="attractionsStatus" className="attraction-status" role="status">{status}</p>:<div id="attractionsList" className="attraction-grid">{places.map(place=><article className="attraction-card" key={place.xid||place.name}><span className="attraction-pin" aria-hidden="true">⌖</span><h3>{place.name||"Unnamed attraction"}</h3><p className="attraction-category">{categoryLabel(place.kinds)}</p><p className="attraction-distance">{distanceLabel(place.dist)}</p><button type="button" className="attraction-toggle" onClick={()=>toggleDetails(place)} aria-expanded={Boolean(open[place.xid])} disabled={!place.xid}>{loading[place.xid]?"Loading…":open[place.xid]?"Hide details":"View details"}</button>{open[place.xid]&&<p className="attraction-details">{details[place.xid]?.description||"Loading attraction information…"}</p>}{details[place.xid]?.website&&<a className="attraction-website" href={details[place.xid].website} target="_blank" rel="noopener noreferrer">Visit website ↗</a>}</article>)}</div>}
    <p className="attraction-source-note">Attraction information is provided by the destination information service. Distances are approximate and measured from the destination search centre.</p>
  </section>;
}
