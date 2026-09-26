# Deploy ke cPanel — NikiStore Web

Database: **SQLite** (`data/store.db`). TIDAK ADA MySQL.
Yang perlu disiapkan: cPanel hosting (Fitur: **Setup Node.js App**), Node.js 18+.

---

## Langkah 1 — Upload

Buka cPanel → **File Manager** → `public_html/` (atau subfolder, misal
`public_html/nikistore` kalau ingin di subdirectory).

Upload semua isi folder `nikistore-web/` **kecuali**:
- `node_modules/` (akan diinstall via cPanel)
- `.env` (input manual di step 3)
- `data/store.db` (kosong saja, nanti dibuat otomatis)

Jadi di server akan ada:
```
public_html/app/
public_html/lib/
public_html/data/         (folder harus ada, isinya products.json dll)
public_html/package.json
public_html/server.js
public_html/next.config.js
...
```

---

## Langkah 2 — Setup Node.js App

cPanel → **Software** → **Setup Node.js App** → **Create Application**.

Isi form:
| Field | Value |
|---|---|
| Node.js version | 18.x atau 20.x (rekomendasi 20) |
| Application mode | Production |
| Application root | `nikistore-web` (atau folder tempat Anda upload, relatif ke home) |
| Application URL | domain Anda (mis. `store.nikistore.biz.id`) |
| Application startup file | **server.js** |
| Passenger log file | biarkan default |

Klik **Create**.

---

## Langkah 3 — Environment Variables

Di halaman Setup Node.js App yang baru dibuat, scroll ke **Environment variables**
dan tambahkan **satu per satu** (copy-paste dari `.env` Anda):

**WAJIB — situs tidak jalan tanpa ini:**

| Variable | Value | Catatan |
|---|---|---|
| `SITE_URL` | `https://store.nikistore.biz.id` | ganti domain Anda |
| `ORDER_SIGNING_SECRET` | `[REDACTED] | acak 64 char |
| `ADMIN_PASSWORD` | `[REDACTED] | password login `/admin` |
| `ADMIN_SESSION_SECRET` | `[REDACTED] | acak 64 char |
| `CRON_SECRET` | `[REDACTED] | acak 32 char |
| `NEXT_PUBLIC_PANEL_ORDERS_ENABLED` | `true` | tampilkan fitur panel server |

**PayGateway (bisa diisi nanti via admin panel):**

| Variable | Value |
|---|---|
| `PAYGW_URL` | `https://pay.halogamingzone.com` |
| `PAYGW_API_KEY` | `qp_...` (API key PayGateway Anda) |

**Pterodactyl (bisa diisi nanti via admin panel):**

| Variable | Value |
|---|---|
| `PTERO_URL` | `https://svr.nikistore.biz.id` |
| `PTERO_API_KEY` | `ptla_...` (Application API key dari panel Anda) |
| `PTERO_NODE_ID` | `1` |

Generate secret acak dengan command ini (Termux/VPS):
```bash
openssl rand -hex 32
```

Klik **Save** setelah selesai.

---

## Langkah 4 — NPM Install

Di halaman Setup Node.js App, klik **Run NPM Install**.
Tunggu sampai selesai. Install ini akan:
- Download semua dependencies (`next`, `react`, `better-sqlite3`, `jose`, ...)
- **Compile `better-sqlite3`** (native module) untuk versi Node server ini

> Kalau **Run NPM Install** gagal / timeout, baca section
> "Kalau NPM install gagal" di bawah.

---

## Langkah 5 — Build

**Ada 2 opsi** (pilih satu):

### Opsi A — Build di Termux, upload folder `.next/`

(Kalau Run NPM install selalu gagal di cPanel.)

Di Termux, di dalam folder `nikistore-web`:
```bash
npx next build --webpack
```
Lalu upload folder `.next/` ke server via File Manager.

**PERHATIAN:** `next build` menghasilkan binary yang spesifik per-versi-Node.
Kalau versi Node di Termux (v24) berbeda jauh dari server cPanel (v20),
build bisa tidak jalan. Lebih aman pakai Opsi B.

### Opsi B — Build via cPanel terminal (RECOMMENDED)

cPanel → **Terminal** (atau SSH hosting Anda), lalu:
```bash
cd public_html/nikistore-web
npm install
npx next build
```
Tunggu sampai sukses (muncul "Compiled successfully").

---

## Langkah 6 — Restart App

Kembali ke halaman **Setup Node.js App** → klik **Restart**.

Buka Application URL di browser. Harusnya muncul halaman toko.

---

## Langkah 7 — Cek Admin

Buka `https://store.nikistore.biz.id/admin/login`

Login dengan `ADMIN_PASSWORD` yang Anda set di step 3.

Kalau belum set PayGateway key via env (step 3), buka tab **Settings**:
- Isi **PayGateway URL** + **PayGateway API Key**
- Isi **Panel URL** + **Application API Key** Pterodactyl
- Klik **Simpan**, lalu **Tes Koneksi PayGateway** — harusnya muncul
  `✅ Koneksi PayGateway OK. Invoice test: ...`

---

## Troubleshooting

### Aplikasi blank / 502 / "Failed to start"

Lihat log Passenger. Setup Node.js App → Application Anda → **Passenger log file**
(biasanya `~/logs/` di home, atau klik link yang ada di halaman itu).

Error umum:
- `Cannot find module 'better-sqlite3'` → NPM install belum selesai/belum benar.
- `Error: ... was compiled against a different Node.js version` → Opsi A dipakai
  tapi versi Node beda. Ulangi dengan Opsi B (build di server).
- `EACCES: permission denied, open '/home/.../data/store.db'` → folder `data/`
  tidak ada atau tidak writable. Bikin manual via File Manager,
  set permission folder ke 755.

### Kalau NPM install gagal

cPanel sering block `npm install` di shared hosting (memory limit, atau
`node-gyp` untuk native module seperti better-sqlite3 diblokir).

**Solusinya:** install `better-sqlite3` di Termux, lalu zip + upload.

```bash
cd ~/nikistore-web
rm -rf node_modules
npm install            # install semua deps di Termux
npx node-gyp rebuild --directory=node_modules/better-sqlite3   # compile native
npx next build --webpack
tar -czf deploy.tar.gz --exclude=data/store.db --exclude=.env \
  app lib public data package.json package-lock.json server.js \
  next.config.js tsconfig.json node_modules .next
```

Upload `deploy.tar.gz` ke folder aplikasi di cPanel, extract di sana.
Ini sudah pernah Anda lakukan untuk project PayGateway sebelumnya
("ships a zipped node_modules via File Manager").

**SANGAT PENTING:** versi Node di Termux dan di server cPanel harus sama
atau beda 1 major version saja. Cek di server:
```bash
node -v   # di cPanel terminal/SSH
```
Kalau server v20 dan Termux v24, native module `better-sqlite3` kemungkinan
tidak cocok. Solusinya: install Node 20 di Termux dulu sebelum `npm install`:
```bash
pkg install nodejs-20     # atau nvm install 20
```

### Database reset / data hilang

SQLite file ada di `data/store.db` (relatif ke application root).
Backup berkala via File Manager (download file `store.db`).

Kalau aplikasi pindah folder, pindahkan juga `data/store.db`-nya.

### Webhook PayGateway

Tidak wajib. Aplikasi polling PayGateway otomatis tiap beberapa detik untuk
cek status pembayaran. Webhook hanya untuk akselerasi (instan).

Kalau mau set webhook: PayGateway dashboard → webhook URL:
```
https://store.nikistore.biz.id/api/webhook/paygateway
```

---

## Checklist singkat

1. [ ] Upload semua file ke application root (kecuali node_modules, .env, store.db)
2. [ ] Create Application: Node 20, startup file `server.js`
3. [ ] Set semua env vars (terutama 4 SECRET + SITE_URL + ADMIN_PASSWORD)
4. [ ] Run NPM Install (atau upload node_modules ter-zip)
5. [ ] Build (opsi A atau B)
6. [ ] Restart app, buka URL → halaman toko muncul
7. [ ] `/admin/login` → login → Settings → set PayGateway + Pterodactyl → Tes Koneksi
