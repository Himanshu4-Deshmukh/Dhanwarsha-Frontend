import { defineConfig } from "vite";
import { readFileSync } from "node:fs";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: true,
    },
  },
  plugins: [
    {
      name: "serve-landing-page-at-root",
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          const pathname = new URL(request.url ?? "/", "http://localhost").pathname;

          if (pathname !== "/") {
            next();
            return;
          }

          response.statusCode = 200;
          response.setHeader("Content-Type", "text/html; charset=utf-8");
          response.end(
            readFileSync(path.resolve(__dirname, "public/landing.html"), "utf-8"),
          );
        });
      },
    },
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: false,
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Don't let the service worker serve index.html for the landing page.
        // "/" and "/landing.html" must always hit the network (Vercel rewrite).
        navigateFallbackDenylist: [/^\/$/, /^\/landing\.html/, /^\/~oauth/],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // NOTE: public/landing.html is auto-copied to dist/landing.html by Vite.
  // Do NOT add it to rollupOptions.input — that creates a duplicate
  // dist/src/landing.html and is the wrong source of truth.
}));
