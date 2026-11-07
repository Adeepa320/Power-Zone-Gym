/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    // Mongoose must not be bundled into server components / route handlers.
    serverComponentsExternalPackages: ['mongoose', 'bcryptjs'],
  },
  images: {
    // Only local images (public/images) are used. Add remote patterns here
    // if gym photos are later served from a CDN.
    formats: ['image/avif', 'image/webp'],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
