import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The single implicit league became a platform: league pages live under /<code>/…
      { source: "/clasificacion", destination: "/", permanent: true },
      { source: "/calendario", destination: "/", permanent: true },
      { source: "/admin", destination: "/", permanent: true },
    ];
  },
};

export default nextConfig;
