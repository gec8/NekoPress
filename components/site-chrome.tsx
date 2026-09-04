"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export function SiteChrome({ children }:{ children:React.ReactNode }) {
  const pathname=usePathname();
  if(pathname.startsWith("/admin")) return children;
  return <><Header/>{children}<Footer/></>;
}
