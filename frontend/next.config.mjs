import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: [
    "scraper.tail3aad92.ts.net",
    "*.ts.net",
    "localhost:3000",
    "127.0.0.1:3000",
    "*.trycloudflare.com",
  ],
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: __dirname,
  },
  env: {
    NEXT_PUBLIC_PUBLIC_URL:
      process.env.NEXT_PUBLIC_PUBLIC_URL ||
      process.env.PUBLIC_URL ||
      "",
  },
};

// Only enable static HTML export when building specifically for Capacitor mobile app package
const isExportBuild =
  process.env.CAPACITOR_BUILD === "true" ||
  process.env.npm_lifecycle_event === "cap:build";

if (isExportBuild) {
  nextConfig.output = "export";
  nextConfig.env = {
    ...nextConfig.env,
    NEXT_PUBLIC_IS_CAPACITOR_BUILD: "true",
  };
} else {
  nextConfig.rewrites = async () => [
    {
      source: "/api/:path*",
      destination: `${process.env.BACKEND_INTERNAL_URL || "http://127.0.0.1:4000/api"}/:path*`,
    },
  ];
}

export default nextConfig;
