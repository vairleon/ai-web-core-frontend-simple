import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // reactStrictMode: true,
    domains: ['localhost'], // Add any other domains you need to support
    // If you're also using other domains (like production URL), add them here
    // For example: domains: ['localhost', 'your-production-domain.com']

    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
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
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: http: https:",
              `connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL}`,
            ].join('; ')
          }
        ],
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
