import Link from "next/link";
import PackageList from "@/components/package-list";
import "../packages.css";

export const metadata = {
  title: "Holiday Packages | Explore Domestic & International Tours",
  description: "Explore curated holiday packages with Travel Qila. Discover destinations, compare trip details and request a personalised quotation.",
  alternates: { canonical: "/packages.html" }
};

export default async function PackagesPage({searchParams}) {
  const params=await searchParams;
  const initialSearch=typeof params?.search==="string"?params.search:"";
  return <main className="packages-page">
    <section className="packages-hero"><div className="container">
      <h1>Explore Holiday Packages</h1>
      <p>Discover destinations. Find inspiration. Plan your next journey.</p>
      <div className="packages-breadcrumb"><Link href="/">Home</Link><span>/</span><span>Packages</span></div>
    </div></section>
    <PackageList initialSearch={initialSearch}/>
  </main>;
}
