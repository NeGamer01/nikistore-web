# Tambah Produk

Cara paling gampang:

```bash
npm run product:add
```

Isi promptnya. Script akan menambahkan produk ke `data/products.json` dan env download ke `.env.example`.

Set link file asli di Vercel:

```bash
DOWNLOAD_NAMA_PRODUK_URL=https://link-download-file.zip
```

Edit manual juga bisa di `data/products.json`.

Untuk promo, tambahkan `promoPrice` lebih kecil dari `price`:

```json
{
  "price": 149000,
  "promoPrice": 99000
}
```
