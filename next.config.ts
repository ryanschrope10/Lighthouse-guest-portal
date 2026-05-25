import type { NextConfig } from "next";

// The build always runs from the project root, so cwd is the app dir.
const projectRoot = process.cwd();

const nextConfig: NextConfig = {
  output: "standalone",

  // Pin the workspace/file-tracing root to THIS app directory. Without
  // this, extra lockfiles in the tree (e.g. lcp-website, git worktrees)
  // make Next infer a parent dir as the root and nest the standalone
  // output under a subpath, so `.next/standalone/server.js` goes missing
  // and the build's copy step (and the Render Dockerfile) breaks.
  outputFileTracingRoot: projectRoot,
  turbopack: { root: projectRoot },

  // Allow service worker to control the entire site scope
  async headers() {
    return [
      {
        // Service worker scope header
        source: "/sw.js",
        headers: [
          {
            key: "Service-Worker-Allowed",
            value: "/",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
      {
        // PWA and security headers for all routes
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: "/icons/(.*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // PWA manifest should not be cached aggressively
        source: "/manifest.json",
        headers: [
          {
            key: "Cache-Control",
            value: "no-cache",
          },
          {
            key: "Content-Type",
            value: "application/manifest+json",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
