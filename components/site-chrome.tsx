"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export function SiteChrome({ children }:{ children:React.ReactNode }) {
  const pathname=usePathname();
  if(pathname.startsWith("/admin")) return children;
  return <><a href="#main-content" className="skip-link">跳到主要内容</a><Header/><div id="main-content" tabIndex={-1}>{children}</div><Footer/></>;
}
