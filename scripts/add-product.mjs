import { readFile, writeFile } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const productsPath = new URL("../data/products.json", import.meta.url);
const envExamplePath = new URL("../.env.example", import.meta.url);

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function envKeyFromSlug(slug) {
  return `DOWNLOAD_${slug.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_URL`;
}

function splitList(value) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function askRequired(rl, label, fallback = "") {
  const suffix = fallback ? ` (${fallback})` : "";
  const answer = (await rl.question(`${label}${suffix}: `)).trim();
  const value = answer || fallback;
  if (!value) return askRequired(rl, label, fallback);
  return value;
}

async function askPrice(rl) {
  const raw = (await rl.question("Harga angka saja, contoh 149000: ")).trim();
  const price = Number(raw.replace(/[^\d]/g, ""));
  if (!Number.isFinite(price) || price <= 0) {
    console.log("Harga tidak valid.");
    return askPrice(rl);
  }
  return price;
}

async function askOptionalPrice(rl, price) {
  const raw = (await rl.question("Harga promo opsional, kosongkan jika tidak ada: ")).trim();
  if (!raw) return undefined;
  const promoPrice = Number(raw.replace(/[^\d]/g, ""));
  if (!Number.isFinite(promoPrice) || promoPrice <= 0 || promoPrice >= price) {
    console.log("Harga promo harus lebih kecil dari harga asli.");
    return askOptionalPrice(rl, price);
  }
  return promoPrice;
}

const products = JSON.parse(await readFile(productsPath, "utf8"));
const rl = createInterface({ input, output });

try {
  const title = await askRequired(rl, "Nama produk");
  const suggestedSlug = slugify(title);
  const slug = slugify(await askRequired(rl, "Slug", suggestedSlug));

  if (products.some((product) => product.slug === slug || product.id === slug)) {
    throw new Error(`Produk "${slug}" sudah ada.`);
  }

  const price = await askPrice(rl);
  const promoPrice = await askOptionalPrice(rl, price);
  const category = await askRequired(rl, "Kategori", "Web App");
  const subtitle = await askRequired(rl, "Subtitle singkat");
  const description = await askRequired(rl, "Deskripsi");
  const image = await askRequired(
    rl,
    "URL gambar",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80"
  );
  const stack = splitList(await askRequired(rl, "Stack, pisahkan koma", "Next.js, Vercel, QRIS"));
  const includes = splitList(
    await askRequired(rl, "Isi paket, pisahkan koma", "Full source code, Dokumentasi setup")
  );
  const highlights = splitList(await askRequired(rl, "Highlight, pisahkan koma", "Siap deploy, Responsive"));
  const downloadEnvKey = envKeyFromSlug(slug);

  products.push({
    id: slug,
    slug,
    title,
    subtitle,
    description,
    price,
    ...(promoPrice ? { promoPrice } : {}),
    category,
    image,
    stack,
    includes,
    highlights,
    downloadEnvKey
  });

  await writeFile(productsPath, `${JSON.stringify(products, null, 2)}\n`);

  let envExample = await readFile(envExamplePath, "utf8");
  if (!envExample.includes(`${downloadEnvKey}=`)) {
    envExample = `${envExample.trimEnd()}\n${downloadEnvKey}=https://example.com/${slug}.zip\n`;
    await writeFile(envExamplePath, envExample);
  }

  console.log(`\nProduk ditambahkan: ${title}`);
  console.log(`URL detail: /products/${slug}`);
  console.log(`Set env download di Vercel: ${downloadEnvKey}`);
} finally {
  rl.close();
}
