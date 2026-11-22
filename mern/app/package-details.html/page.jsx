import {notFound} from "next/navigation";
import PackageDetail from "@/components/package-detail";
import {packageById} from "@/lib/package-data";
import "../packages.css";
export async function generateMetadata({searchParams}){const params=await searchParams;const item=packageById[params?.id];return {title:item?item.name+" Package Details":"Package Details",description:item?.description||"Explore holiday ideas with Travel Qila.",robots:{index:false,follow:true}};}
export default async function PackageDetailsPage({searchParams}){const params=await searchParams;const item=packageById[params?.id];if(!item)notFound();return <PackageDetail item={item}/>;}
