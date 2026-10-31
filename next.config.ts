import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {
  async headers() {
    const editorOrigins = (process.env.NEXT_PUBLIC_PREVIEW_EDITOR_ORIGINS ?? '').split(',').map((origin) => origin.trim()).filter(Boolean)
    const frameAncestors = ["'self'", ...editorOrigins].join(' ')
    return [{ source: '/:locale/preview', headers: [{ key: 'Content-Security-Policy', value: `frame-ancestors ${frameAncestors}` }] }]
  },
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost", port: "8000" },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
    ],
  },
};

export default withNextIntl(nextConfig);
