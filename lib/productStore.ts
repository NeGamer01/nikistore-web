/**
 * Product store — SQLite (menggantikan MongoDB).
 * Katalog awal di-seed dari data/products.json. Setelah itu, semua CRUD
 * lewat admin panel tersimpan di tabel products.
 */
import productData from "@/data/products.json";
import { getDb } from "./db";

export type ProductRecord = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  promoPrice?: number;
  category: string;
  image: string;
  stack: string[];
  includes: string[];
  highlights: string[];
  downloadEnvKey: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

let seeded = false;

function seedProducts(): void {
  if (seeded) return;
  seeded = true;
  const db = getDb();
  const count = (db.prepare("SELECT COUNT(*) AS n FROM products").get() as { n: number }).n;
  if (count > 0) return;

  const insert = db.prepare(
    `INSERT INTO products (id, slug, title, subtitle, description, price, promo_price, category, image, stack, includes, highlights, download_env_key, active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  );
  const now = Date.now();
  for (const p of productData as Array<Record<string, any>>) {
    insert.run(
      String(p.id),
      String(p.slug),
      String(p.title),
      String(p.subtitle || ""),
      String(p.description || ""),
      Number(p.price) || 0,
      p.promoPrice ? Number(p.promoPrice) : null,
      String(p.category || ""),
      String(p.image || ""),
      JSON.stringify(p.stack || []),
      JSON.stringify(p.includes || []),
      JSON.stringify(p.highlights || []),
      String(p.downloadEnvKey || ""),
      1
    );
  }
  void now;
}

type ProductRow = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  price: number;
  promo_price: number | null;
  category: string | null;
  image: string | null;
  stack: string | null;
  includes: string | null;
  highlights: string | null;
  download_env_key: string | null;
  active: number;
  created_at: string;
  updated_at: string;
};

function toRecord(row: ProductRow): ProductRecord {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subtitle: row.subtitle ?? "",
    description: row.description ?? "",
    price: row.price,
    promoPrice: row.promo_price ?? undefined,
    category: row.category ?? "",
    image: row.image ?? "",
    stack: safeParse(row.stack),
    includes: safeParse(row.includes),
    highlights: safeParse(row.highlights),
    downloadEnvKey: row.download_env_key ?? "",
    active: row.active === 1,
    createdAt: new Date(row.created_at + "Z").getTime() || Date.now(),
    updatedAt: new Date(row.updated_at + "Z").getTime() || Date.now()
  };
}

function safeParse(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function getAllProducts(): ProductRecord[] {
  seedProducts();
  const rows = getDb()
    .prepare("SELECT * FROM products WHERE active = 1 ORDER BY created_at DESC")
    .all() as ProductRow[];
  return rows.map(toRecord);
}

export function getAllProductsAdmin(): ProductRecord[] {
  seedProducts();
  const rows = getDb()
    .prepare("SELECT * FROM products ORDER BY created_at DESC")
    .all() as ProductRow[];
  return rows.map(toRecord);
}

export function getProductById(id: string): ProductRecord | null {
  seedProducts();
  const row = getDb().prepare("SELECT * FROM products WHERE id = ?").get(id) as
    | ProductRow
    | undefined;
  return row ? toRecord(row) : null;
}

export function getProductBySlug(slug: string): ProductRecord | null {
  seedProducts();
  const row = getDb().prepare("SELECT * FROM products WHERE slug = ?").get(slug) as
    | ProductRow
    | undefined;
  return row ? toRecord(row) : null;
}

export function createProduct(
  product: Omit<ProductRecord, "id" | "createdAt" | "updatedAt">
): string {
  const db = getDb();
  const id = `prod-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  db.prepare(
    `INSERT INTO products (id, slug, title, subtitle, description, price, promo_price, category, image, stack, includes, highlights, download_env_key, active)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    id,
    product.slug,
    product.title,
    product.subtitle,
    product.description,
    product.price,
    product.promoPrice ?? null,
    product.category,
    product.image,
    JSON.stringify(product.stack || []),
    JSON.stringify(product.includes || []),
    JSON.stringify(product.highlights || []),
    product.downloadEnvKey,
    product.active ? 1 : 0
  );
  return id;
}

export function updateProduct(id: string, updates: Partial<ProductRecord>): void {
  const db = getDb();
  const current = getProductById(id);
  if (!current) throw new Error("Produk tidak ditemukan.");

  const merged = { ...current, ...updates };
  db.prepare(
    `UPDATE products SET
       slug = ?, title = ?, subtitle = ?, description = ?, price = ?, promo_price = ?,
       category = ?, image = ?, stack = ?, includes = ?, highlights = ?,
       download_env_key = ?, active = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    merged.slug,
    merged.title,
    merged.subtitle,
    merged.description,
    merged.price,
    merged.promoPrice ?? null,
    merged.category,
    merged.image,
    JSON.stringify(merged.stack || []),
    JSON.stringify(merged.includes || []),
    JSON.stringify(merged.highlights || []),
    merged.downloadEnvKey,
    merged.active ? 1 : 0,
    id
  );
}

export function deleteProduct(id: string): void {
  getDb().prepare("DELETE FROM products WHERE id = ?").run(id);
}
