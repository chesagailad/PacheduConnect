/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< HEAD
  reactStrictMode: true,
  swcMinify: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
    NEXT_PUBLIC_ADMIN_URL: process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001',
  },
  images: {
    domains: ['localhost', 'api.pacheduconnect.com'],
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

module.exports = nextConfig; 
=======
  output: 'standalone',
  images: {
    domains: [
      // Remove localhost for production, add via environment variable if needed
      ...(process.env.NODE_ENV === 'development' ? ['localhost'] : []),
      'pachedu.com',
      'api.pachedu.com',
      // Add custom domains from environment if specified
      ...(process.env.NEXT_PUBLIC_IMAGE_DOMAINS ? process.env.NEXT_PUBLIC_IMAGE_DOMAINS.split(',') : []),
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  async rewrites() {
    // Only use rewrites in development or when API_REWRITE_URL is set
    const apiUrl = process.env.API_REWRITE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : null);
    
    if (apiUrl) {
      return [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/api/:path*`,
        },
      ];
    }
    
    return [];
  },
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  basePath: '/admin',
};

module.exports = nextConfig;
>>>>>>> origin/main
