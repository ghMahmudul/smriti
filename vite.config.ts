/// <reference types="vitest/config" />
import { readFileSync } from "node:fs";
import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

const pkg = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf-8"),
);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "script",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "apple-touch-icon.png",
        "pwa-64x64.png",
        "pwa-192x192.png",
        "pwa-512x512.png",
        "maskable-icon-192x192.png",
        "maskable-icon-512x512.png",
      ],
      manifest: {
        id: "/",
        name: "Smriti",
        short_name: "Smriti",
        description: "Local-first task management powered by .todo files",
        theme_color: "#ffffff",
        background_color: "#09090b",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        categories: ["productivity", "utilities"],
        icons: [
          {
            src: "/pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/maskable-icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/favicon.svg",
            sizes: "any",
            type: "image/svg+xml",
            purpose: "any",
          },
        ],
        shortcuts: [
          {
            name: "Inbox",
            short_name: "Inbox",
            description: "Open inbox tasks",
            url: "/inbox",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
          {
            name: "Today",
            short_name: "Today",
            description: "View today's tasks",
            url: "/today",
            icons: [{ src: "/pwa-192x192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        enabled: true,
        suppressWarnings: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-router/")) return "router";
          if (id.includes("node_modules/react-dom/")) return "vendor";
          if (id.includes("node_modules/react/")) return "vendor";
          if (
            id.includes("node_modules/@base-ui/") ||
            id.includes("node_modules/cmdk/") ||
            id.includes("node_modules/class-variance-authority/")
          )
            return "ui";
          if (id.includes("node_modules/zustand/")) return "state";
        },
      },
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    globals: true,
    exclude: ["e2e/**", "node_modules/**"],
  },
});
