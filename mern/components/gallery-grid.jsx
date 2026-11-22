"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const count=12;
const categories=["World Tour","World Tour","World Tour","Ocean Tour","Ocean Tour","Ocean Tour","Summer Tour","Summer Tour","Summer Tour","Sport Tour","Sport Tour","Sport Tour"];
const filters=["All","World Tour","Ocean Tour","Summer Tour","Sport Tour"];

export default function GalleryGrid() {
  const [active,setActive]=useState(-1);
  const [filter,setFilter]=useState("All");
  const visible=Array.from({length:count},(_,index)=>index).filter(index=>filter==="All"||categories[index]===filter);

  useEffect(()=>{
    if(active<0)return;
    function onKey(event){
      if(event.key==="Escape")setActive(-1);
      if(event.key==="ArrowRight")setActive(value=>(value+1)%count);
      if(event.key==="ArrowLeft")setActive(value=>(value-1+count)%count);
    }
    window.addEventListener("keydown",onKey);
    document.body.style.overflow="hidden";
    return ()=>{
      window.removeEventListener("keydown",onKey);
      document.body.style.overflow="";
    };
  },[active]);

  return <>
    <div className="home-filter-tabs gallery-filter-tabs" role="group" aria-label="Filter gallery images">
      {filters.map(item=><button key={item} type="button" className={filter===item?"active":""} aria-pressed={filter===item} onClick={()=>setFilter(item)}>{item}</button>)}
    </div>
    <div className="gallery-grid">
      {visible.map(index=><button type="button" className={`gallery-tile gallery-tile-${index%4}`} key={index} onClick={()=>setActive(index)} aria-label={`Open travel gallery image ${index+1}`}>
        <Image src={`/img/gallery-${index+1}.jpg`} alt={`Travel destination gallery ${index+1}`} fill sizes="(max-width:600px) 100vw, 33vw"/>
      </button>)}
    </div>
    {active>=0&&<div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Travel photo viewer" onClick={()=>setActive(-1)}>
      <button className="gallery-close" type="button" onClick={()=>setActive(-1)} aria-label="Close image viewer">×</button>
      <button className="gallery-prev" type="button" onClick={event=>{event.stopPropagation();setActive(value=>(value-1+count)%count);}} aria-label="Previous image">‹</button>
      <div className="gallery-lightbox-image" onClick={event=>event.stopPropagation()}><Image src={`/img/gallery-${active+1}.jpg`} alt={`Travel destination image ${active+1}`} fill sizes="90vw"/></div>
      <button className="gallery-next" type="button" onClick={event=>{event.stopPropagation();setActive(value=>(value+1)%count);}} aria-label="Next image">›</button>
      <span className="gallery-counter">{active+1} / {count}</span>
    </div>}
  </>;
}
