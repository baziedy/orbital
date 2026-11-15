/** @type {import('next').NextConfig} */
const localBackendUrl = (process.env.ORBITAL_LOCAL_BACKEND_URL || "http://127.0.0.1:8000").replace(/\/$/, "");

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
  async rewrites() {
    // In a Vercel services deployment, the root vercel.json owns /api routing.
    // Keep this local proxy only for running `next dev` without `vercel dev`.
    if (process.env.VERCEL === "1") return [];

    return [
      {
        source: '/api/:path*',
        destination: `${localBackendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
