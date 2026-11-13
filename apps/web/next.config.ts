import type { NextConfig } from "next"
import path from "node:path"

// `import.meta.dirname` is the directory of this config file (apps/web). It is
// available in Node >= 20.11; `process.cwd()` is the fallback.
const here = import.meta.dirname ?? process.cwd()

const nextConfig: NextConfig = {
  // This repository is an npm workspace, so `next` is hoisted to the repository
  // root rather than sitting in apps/web/node_modules. Turbopack resolves
  // `next/package.json` relative to the filesystem root it is given, and by
  // default that root is the app directory - where `next` is not installed.
  // Pointing the root at the workspace root lets the resolver find it.
  turbopack: {
    root: path.join(here, "../.."),
  },
}

export default nextConfig
