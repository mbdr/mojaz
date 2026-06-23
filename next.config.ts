import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Produces a minimal, self-contained .next/standalone build (only the
  // files actually needed at runtime) - the recommended setup for Docker
  // deployments, since the runtime image never needs node_modules or a
  // second `npm install`.
  output: "standalone",
};

export default nextConfig;
