# NikiStore

Next.js store untuk jual source code digital. Payment memakai Okepay/Orderkuota API eksternal, bukan bot WhatsApp.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Isi env:

```bash
OKEPAY_BASE_URL=https://apipay.nikistore.biz.id/api.php
OKEPAY_API_KEY=apikey_okepay
ORDER_SIGNING_SECRET=random_panjang
SITE_URL=https://domain-vercel-kamu.vercel.app
FONNTE_TOKEN=token_dari_menu_device_fonnte
OWNER_WHATSAPP_NUMBER=628xxxxxxxxxx
DOWNLOAD_STARTER_STORE_URL=https://link-download/source.zip
```

`FONNTE_TOKEN` adalah token yang dicopy dari menu Device di Fonnte. Token itu menentukan device pengirim. `OWNER_WHATSAPP_NUMBER` adalah nomor tujuan notifikasi owner, boleh berbeda dari nomor device pengirim.

Untuk produk panel Pterodactyl, isi juga env berikut:

```bash
PTERO_PANEL_URL=panel.domainkamu.com
PTLA_API_KEY=ptla_xxx
PTLC_API_KEY=ptlc_xxx
DEFAULT_LOCATION_ID=1
DEFAULT_NEST_ID=...
DEFAULT_EGG_ID=...
WRAPPER_API_URL=https://wrapper-api-kamu
```

`WRAPPER_API_URL` adalah endpoint pembungkus Pterodactyl yang menyediakan `GET /api/pterodactyl/create`. Kalau env Pterodactyl belum lengkap, order panel tetap dibuat tetapi server tidak diprovisioning otomatis dan UI menampilkan status `paid_pending_panel` agar owner bisa setup manual.

## Alur

1. Buyer checkout produk.
2. Server membuat token order signed.
3. Server request `qris_dinamis` ke Okepay.
4. Halaman payment polling `qris_mutasi`.
5. Jika nominal unik cocok:
   - produk `source` → buyer dapat link download dan WA via Fonnte.
   - produk `panel` → server Pterodactyl otomatis dibuat lewat wrapper API, lalu kredensial dikirim ke WA.
6. Owner menerima notifikasi pembelian sukses via WA.

## Produk

Tambah produk:

```bash
npm run product:add
```

Data katalog ada di `data/products.json`. Produk source code memakai `downloadEnvKey` (link download asli disimpan di env). Produk panel Pterodactyl pakai field `type: "panel"` plus `panel: { ram, disk, cpu }` (RAM/disk dalam MB, CPU dalam persen).

## Deploy Vercel

Push repo ke GitHub, import ke Vercel, lalu sync env dari `.env.local`:

```bash
npm run vercel:env
```

Pastikan sudah login dan project sudah ter-link:

```bash
npx vercel login
npx vercel link
```
