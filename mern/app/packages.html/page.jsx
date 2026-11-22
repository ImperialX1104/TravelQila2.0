import PackageList from "@/components/package-list";
import "./packages.css";
export const metadata = {
  title: "Holiday Packages | Explore Domestic & International Tours",
  description: "Explore curated holiday packages with Travel Qila. Discover destinations, compare trip details and request a personalised quotation.",
  alternates: { canonical: "/packages.html" }
};
export default async function PackagesPage({searchParams}) {
  const params=await searchParams;
  const initialSearch=typeof params?.search==="string"?params.search:"";
  return <main><PackageList initialSearch={initialSearch}/></main>;
}
