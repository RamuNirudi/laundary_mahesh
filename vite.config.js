import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(import.meta.dirname, "./src") },
  },
  server: {
    port: 5173,
    // Lets the frontend call the API at a same-origin /api path in development,
    // so VITE_API_BASE_URL only has to be set for deployed environments.
    proxy: {
      "/api": {
        // 127.0.0.1 rather than "localhost": Node resolves "localhost" to ::1
        // first, and anything else bound to [::1]:3001 would swallow the
        // proxied request before it reached the API.
        target: process.env.VITE_API_PROXY_TARGET || "http://127.0.0.1:3001",
        changeOrigin: true,
      },
    },
  },
});
