/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["localhost"], 
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "4000",
        pathname: "/images/**", 
      },
    ],
  },
};

module.exports = nextConfig;