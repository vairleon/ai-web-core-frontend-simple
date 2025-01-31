import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // reactStrictMode: true,
    // domains: ['http://localhost:3000'], // Add any other domains you need to support
    // domains: ['https://webai1.work4creation.fun'], // Add any other domains you need to support
    // If you're also using other domains (like production URL), add them here
    // For example: domains: ['localhost', 'your-production-domain.com']

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'webai1.work4creation.fun',
        pathname: '/uploads/**',
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: 'https://webai2.work4creation.fun'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization'
          },
          {
            key: 'Content-Security-Policy',
            value: `
              default-src 'self';
              connect-src 'self' https://webai1.work4creation.fun https://webai2.work4creation.fun http://localhost:3000;
              script-src 'self' 'unsafe-eval' 'unsafe-inline';
              style-src 'self' 'unsafe-inline';
              img-src 'self' data: blob: http: https:;
              font-src 'self';
            `.replace(/\s+/g, ' ').trim()
          }
        ]
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};



export default nextConfig;
