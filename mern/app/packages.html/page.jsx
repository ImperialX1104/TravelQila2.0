import PackageList from "@/components/package-list";
import "./packages.css";
export const metadata = {title:"Holiday Packages | Explore India & Worldwide",description:"Explore domestic and international holiday packages with Travel Qila. Discover sample itineraries and request a customised travel quotation.",alternates:{canonical:"/packages.html"}};
export default function PackagesPage(){return <main className="packages-page"><section className="packages-hero"><div className="container"><p className="eyebrow">Travel Qila · Explore holiday ideas</p><h1>Find a journey<br/><em>that feels like yours.</em></h1><p>Discover destinations. Find inspiration. Plan your next journey.</p></div></section><PackageList/></main>;}
