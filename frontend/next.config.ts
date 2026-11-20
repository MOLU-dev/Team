import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow requests from any origin in development (CORS disabled)
  // @ts-ignore — allowedDevOrigins is valid in Next 16+
  allowedDevOrigins: ["*"],

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "Access-Control-Allow-Origin", value: "*" },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD",
          },
          {
            key: "Access-Control-Allow-Headers",
            value: "Origin, Content-Type, Authorization, Accept, X-Requested-With",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
