import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained .next/standalone build (only the
  // files actually needed at runtime) - the recommended setup for Docker
  // deployments, since the runtime image never needs node_modules or a
  // second `npm install`.
  output: "standalone",

  // Next's dev server blocks cross-origin requests to internal assets
  // (including the Fast Refresh/HMR websocket) unless the requesting host
  // is explicitly allowed - without this, opening the dev server from
  // another machine's IP loads the page but HMR fails to connect. Only
  // affects `next dev`; has no effect on the production build.
  allowedDevOrigins: ["10.40.23.120"],
};

export default nextConfig;
