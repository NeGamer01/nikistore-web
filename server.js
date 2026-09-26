/**
 * Entry point untuk cPanel "Setup Node.js App" (Phusion Passenger).
 *
 * Cara pakai di cPanel:
 *   1. Setup Node.js App → Application root: nikistore-web
 *   2. Application startup file: server.js
 *   3. Set env vars di form Environment variables (lihat .env)
 *   4. Click Run NPM Install, lalu Start App
 *
 * Tidak butuh `next build` di server kalau sudah ada folder .next/.
 * Passenger akan menjalankan file ini sebagai server.
 */
const { createServer } = require("http");
const next = require("next");

const PORT = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, conf: { distDir: ".next" } });
const handle = app.getRequestHandler();

app
  .prepare()
  .then(() => {
    createServer((req, res) => {
      handle(req, res);
    }).listen(PORT, () => {
      console.log(`> Ready on http://localhost:${PORT} (dev=${dev})`);
    });
  })
  .catch((err) => {
    console.error("Gagal start:", err);
    process.exit(1);
  });
