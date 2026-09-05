// Vercel serves dist/index.html for "/" BEFORE rewrites run,
// so a "/" -> "/landing.html" rewrite never fires (that's why "/" showed
// the React app and bounced to /auth).
// Fix: make the landing page BE dist/index.html, and move the React SPA to
// dist/app.html. App routes then rewrite to /app.html. No "/" rewrite needed.
const { copyFileSync, existsSync } = require("node:fs");
const { resolve, dirname } = require("node:path");

const root = resolve(dirname(__filename), "..");
const reactIndex = resolve(root, "dist/index.html");
const appHtml = resolve(root, "dist/app.html");
const landing = resolve(root, "public/landing.html");
const distIndex = resolve(root, "dist/index.html");

if (!existsSync(reactIndex)) {
  console.error("[copy-landing-index] dist/index.html missing — did vite build fail?");
  process.exit(1);
}
if (!existsSync(landing)) {
  console.error("[copy-landing-index] public/landing.html missing");
  process.exit(1);
}

copyFileSync(reactIndex, appHtml);
copyFileSync(landing, distIndex);
console.log("[copy-landing-index] dist/app.html = React app, dist/index.html = landing page");
