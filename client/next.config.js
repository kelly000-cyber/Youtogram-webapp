/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Emit server chunks at the server build root so runtime require("./<id>.js") finds them
      config.output.chunkFilename = '[name].js';
    }
    return config;
  }
};

module.exports = nextConfig;
