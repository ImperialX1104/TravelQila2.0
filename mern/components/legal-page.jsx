import Link from "next/link";
import {privacySections,termsSections} from "@/lib/legal-data";

const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

export default function LegalPage({type}){
 const privacy=type==="privacy";
 const sections=privacy?privacySections:termsSections;
 const title=privacy?"Privacy Policy":"Terms & Conditions";
 const nav=sections.filter(item=>!/^Your privacy matters|^Terms governing|^Quick navigation/i.test(item.heading));
 return <main className="legal-page"><section className="legal-hero"><div className="container"><p className="eyebrow">Travel Qila · Legal information</p><p className="legal-breadcrumb"><Link href="/">Home</Link> / {title}</p><h1>{title}</h1><p>{privacy?"Your privacy matters to us. Read how Travel Qila handles information when you use this website.":"Terms governing your use of Travel Qila."}</p></div></section><div className="container legal-layout"><aside className="legal-sidebar"><strong>On this page</strong>{nav.map(item=><a key={item.heading} href={`#${slug(item.heading)}`}>{item.heading.replace(/^\d+\. /,"")}</a>)}</aside><article className="legal-content">{sections.map((section,index)=><section id={slug(section.heading)} key={section.heading} className={index===0?"legal-opening":""}><h2>{section.heading}</h2>{section.paragraphs.map((paragraph,i)=><p key={i}>{!privacy&&paragraph.includes("privacy-policy.html")?paragraph.replaceAll("privacy-policy.html","privacy.html"):paragraph}</p>)}{section.items.length>0&&<ul>{section.items.map((item,i)=><li key={i}>{item}</li>)}</ul>}</section>)}<p className="legal-contact">For questions, contact <a href="mailto:info@travelqila.com">info@travelqila.com</a> or visit our <Link href="/contact.html">Contact page</Link>.</p></article></div></main>;
}
