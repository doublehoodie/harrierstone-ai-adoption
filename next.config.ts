import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Next otherwise writes an AGENTS.md on startup.
  agentRules: false,
  // The preview opens the app on 127.0.0.1. Without this, dev scripts are blocked and clicks do nothing.
  allowedDevOrigins: ["127.0.0.1"],
}

export default nextConfig
