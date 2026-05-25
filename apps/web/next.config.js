/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/api/docs',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/docs`,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
