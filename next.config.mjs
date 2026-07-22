/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Allow embedding the demo from the Apideck marketing site so the
        // samples page can launch it in an iframe. Anything else is blocked.
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "frame-ancestors 'self' https://www.apideck.com https://*.apideck.com https://apideck.com",
          },
        ],
      },
    ];
  },
};
export default nextConfig;
