/** @type {import('next').NextConfig} */
const nextConfig = {
     images: {
    remotePatterns: [
      
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'wikimedia.org',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
    ],
  },
};

export default nextConfig;
