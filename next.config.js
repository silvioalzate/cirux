/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  output: 'standalone',
  webpack: (config, { isServer }) => {
    // Prevent GoTrueAdminApi from being bundled in client builds
    // This is an admin-only class that contains example secret strings
    // which trigger false-positive secret leak detection
    if (!isServer) {
      config.resolve.alias['@supabase/auth-js/dist/module/GoTrueAdminApi'] = path.resolve(__dirname, 'src/lib/stubs/GoTrueAdminApi.js');
    }
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "connect-src 'self' https://supabase.silvioalzate.shop wss://supabase.silvioalzate.shop https://evolution.silvioalzate.shop https://n8n.silvioalzate.shop",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "font-src 'self'",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
