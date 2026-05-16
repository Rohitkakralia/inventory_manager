/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  // reactCompiler: true, // Temporarily disabled to fix Turbopack issue
  experimental: {
    turbo: {
      // Add turbopack specific config if needed
    }
  }
};

export default nextConfig;
