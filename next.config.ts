import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  headers: async () => [
    {
      source: "/(.*)",
      headers: [
        // Clickjacking protection
        { key: "X-Frame-Options", value: "DENY" },
        // MIME sniffing prevention
        { key: "X-Content-Type-Options", value: "nosniff" },
        // Referrer leak prevention
        { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        // DNS prefetch
        { key: "X-DNS-Prefetch-Control", value: "on" },
        // Feature policy: only camera is needed
        {
          key: "Permissions-Policy",
          value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()",
        },
        // HTTPS enforcement (2 years, with preload)
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains; preload",
        },
        // Legacy XSS filter (for older browsers)
        { key: "X-XSS-Protection", value: "1; mode=block" },
        // Prevent cross-origin information leaks
        { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      ],
    },
  ],
};

export default nextConfig;
