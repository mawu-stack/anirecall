/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['cdn.myanimelist.net', 's4.anilist.co', 'images.trace.moe', 'media.kitsu.io'],
    unoptimized: true
  }
};

export default nextConfig;
