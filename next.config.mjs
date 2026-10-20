import path from "node:path";
import { fileURLToPath } from "node:url";

// Resolve to this file's directory so the standalone output lands at
// .next/standalone/server.js regardless of the caller's working directory
// (or the presence of an unrelated lockfile higher up the tree).
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  outputFileTracingRoot: projectRoot,
};

export default nextConfig;
