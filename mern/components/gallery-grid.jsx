"use client";
import {useEffect,useState} from "react";
import Image from "next/image";

export default function GalleryGrid(){
 const [active,setActive]=useState(-1);
 const count=12;
 useEffect(()=>{if(active<0)return;function onKey(e){if(e.key==="Escape")setActive(-1);if(e.key==="ArrowRight")setActive(v=>(v+1)%count);if(e.key==="ArrowLeft")setActive(v=>(v-1+count)%count);}window.addEventListener("keydown",onKey);document.body.style.overflow="hidden";return()=>{window.removeEventListener("keydown",onKey);document.body.style.overflow="";};},[active]);
 return <>
  <div className="gallery-grid">{Array.from({length:count},(_,i)=><button className={`gallery-tile gallery-tile-${i%4}`} key={i} onClick={()=>setActive(i)} aria-label={`Open travel gallery image ${i+1}`}><Image src={`/img/gallery-${i+1}.jpg`} alt={`Travel destination gallery ${i+1}`} fill sizes="(max-width:600px) 100vw, 33vw"/></button>)}</div>
  {active>=0&&<div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label="Travel photo viewer" onClick={()=>setActive(-1)}><button className="gallery-close" onClick={()=>setActive(-1)} aria-label="Close image viewer">×</button><button className="gallery-prev" onClick={e=>{e.stopPropagation();setActive(v=>(v-1+count)%count);}} aria-label="Previous image">‹</button><div className="gallery-lightbox-image" onClick={e=>e.stopPropagation()}><Image src={`/img/gallery-${active+1}.jpg`} alt={`Travel destination image ${active+1}`} fill sizes="90vw"/></div><button className="gallery-next" onClick={e=>{e.stopPropagation();setActive(v=>(v+1)%count);}} aria-label="Next image">›</button><span className="gallery-counter">{active+1} / {count}</span></div>}
 </>;
}
