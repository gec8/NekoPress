import type { NextConfig } from "next";

const supabaseHostname = (() => {
  try { return process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname : null; }
  catch { return null; }
})();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.pixabay.com" },
      { protocol: "https", hostname: "images.unsplash.com" },
      ...(supabaseHostname ? [{ protocol: "https" as const, hostname: supabaseHostname }] : []),
    ],
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    const securityHeaders = [
      { key:"X-Content-Type-Options", value:"nosniff" },
      { key:"X-Frame-Options", value:"DENY" },
      { key:"Referrer-Policy", value:"strict-origin-when-cross-origin" },
      { key:"Permissions-Policy", value:"camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()" },
      { key:"Content-Security-Policy", value:"frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
      { key:"Cross-Origin-Opener-Policy", value:"same-origin" },
      ...(process.env.NODE_ENV === "production" ? [{ key:"Strict-Transport-Security", value:"max-age=31536000; includeSubDomains" }] : []),
    ];
    return [{ source:"/:path*", headers:securityHeaders }];
  },
};

export default nextConfig;
