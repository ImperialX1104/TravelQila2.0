"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Facebook, Instagram, Linkedin, LogIn, LogOut, MapPin, Menu, Twitter, UserPlus, Youtube, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const links = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about.html" },
  { label: "Flights", href: "/services.html" },
  { label: "Hotels", href: "/hotels.html" },
  { label: "Visa", href: "/visa.html" },
  { label: "Packages", href: "/packages.html" },
  { label: "Blog", href: "/blog.html" },
  { label: "Contact", href: "/contact.html" }
];

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [user,setUser] = useState(null);
  const [scrolled,setScrolled] = useState(false);
  const [menuOpen,setMenuOpen] = useState(false);
  const solid = /dashboard|login|register|forgot-password|reset-password/.test(pathname||"");

  useEffect(()=>{
    let active=true;
    try {
      getSupabaseBrowserClient().auth.getUser().then(({data,error})=>{
        if(active)setUser(error?null:data?.user||null);
      }).catch(()=>{});
    } catch {}
    const onScroll=()=>setScrolled(window.scrollY>70);
    window.addEventListener("scroll",onScroll,{passive:true});
    onScroll();
    return ()=>{
      active=false;
      window.removeEventListener("scroll",onScroll);
    };
  },[]);

  async function signOut() {
    try {
      await getSupabaseBrowserClient().auth.signOut();
      setUser(null);
      router.push("/login.html");
    } catch {
      router.push("/login.html");
    }
  }

  const sticky = scrolled || solid;
  return <header className={`site-header ${sticky?"is-sticky":""} ${solid?"is-solid":""}`}>
    <div className="site-topbar">
      <div className="site-topbar-inner">
        <div className="site-socials" aria-label="Travel Qila social channels">
          <span aria-label="Twitter"><Twitter size={14}/></span>
          <span aria-label="Facebook"><Facebook size={14}/></span>
          <span aria-label="LinkedIn"><Linkedin size={14}/></span>
          <span aria-label="Instagram"><Instagram size={14}/></span>
          <span aria-label="YouTube"><Youtube size={14}/></span>
        </div>
        <div className="site-account-links">
          {!user ? <>
            <Link href="/register.html"><UserPlus size={13}/>Register</Link>
            <Link href="/login.html"><LogIn size={13}/>Login</Link>
          </> : <>
            <Link href="/dashboard.html">My Dashboard</Link>
            <button type="button" onClick={signOut}><LogOut size={13}/>Log out</button>
          </>}
          <Link href="/dashboard.html" className="site-dashboard-link">My Dashboard</Link>
        </div>
      </div>
    </div>
    <div className="site-navbar">
      <div className="site-navbar-inner">
        <Link className="site-brand" href="/" aria-label="Travel Qila home"><MapPin size={33} strokeWidth={2.6}/><span>Travel Qila</span></Link>
        <button className="site-menu-toggle" type="button" aria-label={menuOpen?"Close navigation":"Open navigation"} aria-expanded={menuOpen} onClick={()=>setMenuOpen(value=>!value)}>{menuOpen?<X size={24}/>:<Menu size={24}/>}</button>
        <nav className={`site-nav-links ${menuOpen?"is-open":""}`} aria-label="Main navigation">
          {links.map(link=><Link key={link.href} href={link.href} className={pathname===link.href||(link.href==="/"&&pathname==="/")?"site-nav-link active":"site-nav-link"} onClick={()=>setMenuOpen(false)}>{link.label}</Link>)}
          <Link className="site-plan-button" href="/trip-enquiry.html" onClick={()=>setMenuOpen(false)}>Plan Your Trip</Link>
        </nav>
      </div>
    </div>
  </header>;
}
