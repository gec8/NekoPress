import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/components/providers";
import { SiteChrome } from "@/components/site-chrome";
import { DEFAULT_SITE_SETTINGS, getSiteSettings } from "@/lib/data";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export async function generateMetadata():Promise<Metadata>{let settings=DEFAULT_SITE_SETTINGS;try{settings=await getSiteSettings();}catch{/* Metadata must not make a deployment depend on database availability. */}const title=settings.seoTitle||settings.siteName;const description=settings.seoDescription||settings.siteDescription;return {metadataBase:new URL(siteUrl),title:{default:title,template:`%s | ${settings.siteName}`},description,openGraph:{type:"website",title,description}}}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN" suppressHydrationWarning><body><Providers><SiteChrome>{children}</SiteChrome></Providers></body></html>;
}
