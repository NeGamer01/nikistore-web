/**
 * SQLite storage. cPanel hosting punya filesystem persistent, jadi tidak
 * perlu MongoDB Atlas. Database disimpan di ./data/store.db (relatif ke
 * working directory aplikasi cPanel).
 */
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let db: Database.Database | null = null;

function dbPath(): string {
  const base = process.env.DB_DIR || path.join(process.cwd(), "data");
  fs.mkdirSync(base, { recursive: true });
  return path.join(base, process.env.DB_NAME || "store.db");
}

// cPanel/Phusion Passenger bisa memulai app dari cwd yang berbeda.
// Simpan DB di bawah application root, bukan di cwd transient passenger.
function resolveDbPath(): string {
  const fromEnv = process.env.DB_DIR;
  if (fromEnv) {
    fs.mkdirSync(fromEnv, { recursive: true });
    return path.join(fromEnv, process.env.DB_NAME || "store.db");
  }
  return dbPath();
}

export function getDb(): Database.Database {
  if (!db) {
    try {
      db = new Database(resolveDbPath());
    } catch (err) {
      // Fallback: coba lokasi yang pasti writable di home hosting.
      const home = process.env.HOME || process.cwd();
      const fallback = path.join(home, "nikistore-data");
      fs.mkdirSync(fallback, { recursive: true });
      db = new Database(path.join(fallback, process.env.DB_NAME || "store.db"));
    }
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    migrate(db);
  }
  return db;
}

export function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      kind TEXT NOT NULL DEFAULT 'source',        -- source | panel
      product_id TEXT,
      product_title TEXT,
      customer_name TEXT,
      customer_email TEXT,
      customer_phone TEXT,
      base_price INTEGER NOT NULL DEFAULT 0,
      unique_code INTEGER NOT NULL DEFAULT 0,
      amount INTEGER NOT NULL DEFAULT 0,
      qris_id TEXT,
      status TEXT NOT NULL DEFAULT 'PENDING',     -- PENDING|PAID|EXPIRED|FAILED
      panel_server_id INTEGER,
      panel_username TEXT,
      panel_password TEXT,
      panel_email TEXT,
      panel_url TEXT,
      server_config TEXT,                          -- JSON PanelSelection
      expires_at TEXT,                             -- berlangganan berakhir
      renewed_count INTEGER NOT NULL DEFAULT 0,
      paid_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_email ON orders(customer_email);
    CREATE INDEX IF NOT EXISTS idx_orders_qris ON orders(qris_id);

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      subtitle TEXT,
      description TEXT,
      price INTEGER NOT NULL DEFAULT 0,
      promo_price INTEGER,
      category TEXT,
      image TEXT,
      stack TEXT,           -- JSON array
      includes TEXT,        -- JSON array
      highlights TEXT,      -- JSON array
      download_env_key TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS event_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL DEFAULT 'INFO',
      message TEXT NOT NULL,
      order_id TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ── settings ──
export function getSetting(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(key) as
    | { value: string }
    | undefined;
  return row?.value ?? null;
}

export async function getSettingAsync(key: string): Promise<string | null> {
  return getSetting(key);
}

export function setSetting(key: string, value: string): void {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = ?"
    )
    .run(key, value, value);
}

export function getAllSettings(): Record<string, string> {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as {
    key: string;
    value: string;
  }[];
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

// ── orders ──
export function saveOrder(payload: {
  id: string;
  kind?: string;
  productId?: string;
  productTitle?: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  basePrice?: number;
  uniqueCode?: number;
  amount?: number;
  qrisId?: string;
  status?: string;
  panelServerId?: number;
  panelUsername?: string;
  panelPassword?: string;
  panelEmail?: string;
  serverConfig?: any;
  paidAt?: string;
}): void {
  const c = getDb();
  const existing = c.prepare("SELECT id FROM orders WHERE id = ?").get(payload.id);
  if (existing) {
    c.prepare(
      `UPDATE orders SET
         qris_id = COALESCE(?, qris_id),
         status = COALESCE(?, status),
         paid_at = COALESCE(?, paid_at),
         panel_server_id = COALESCE(?, panel_server_id),
         panel_username = COALESCE(?, panel_username),
         panel_password = COALESCE(?, panel_password),
         panel_email = COALESCE(?, panel_email),
         server_config = COALESCE(?, server_config),
         updated_at = datetime('now')
       WHERE id = ?`
    ).run(
      payload.qrisId ?? null,
      payload.status ?? null,
      payload.paidAt ?? null,
      payload.panelServerId ?? null,
      payload.panelUsername ?? null,
      payload.panelPassword ?? null,
      payload.panelEmail ?? null,
      payload.serverConfig ? JSON.stringify(payload.serverConfig) : null,
      payload.id
    );
    return;
  }
  c.prepare(
    `INSERT INTO orders (
       id, kind, product_id, product_title, customer_name, customer_email, customer_phone,
       base_price, unique_code, amount, qris_id, status,
       panel_server_id, panel_username, panel_password, panel_email, server_config, paid_at
     ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
  ).run(
    payload.id,
    payload.kind || "source",
    payload.productId ?? null,
    payload.productTitle ?? null,
    payload.customerName ?? null,
    payload.customerEmail ?? null,
    payload.customerPhone ?? null,
    payload.basePrice ?? 0,
    payload.uniqueCode ?? 0,
    payload.amount ?? 0,
    payload.qrisId ?? null,
    payload.status ?? "PENDING",
    payload.panelServerId ?? null,
    payload.panelUsername ?? null,
    payload.panelPassword ?? null,
    payload.panelEmail ?? null,
    payload.serverConfig ? JSON.stringify(payload.serverConfig) : null,
    payload.paidAt ?? null
  );
}

export type OrderRow = {
  id: string;
  kind: string;
  product_id: string | null;
  product_title: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  base_price: number;
  unique_code: number;
  amount: number;
  qris_id: string | null;
  status: string;
  panel_server_id: number | null;
  panel_username: string | null;
  panel_password: string | null;
  panel_email: string | null;
  server_config: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

export function getOrderById(id: string): OrderRow | null {
  return (getDb().prepare("SELECT * FROM orders WHERE id = ?").get(id) as OrderRow | undefined) ?? null;
}

export function getOrderByQrisId(qrisId: string): OrderRow | null {
  return (getDb().prepare("SELECT * FROM orders WHERE qris_id = ?").get(qrisId) as OrderRow | undefined) ?? null;
}

export function getOrdersByEmail(email: string): OrderRow[] {
  return getDb()
    .prepare("SELECT * FROM orders WHERE customer_email = ? ORDER BY created_at DESC")
    .all(email.toLowerCase()) as OrderRow[];
}

export function getPendingOrders(): OrderRow[] {
  return getDb()
    .prepare("SELECT * FROM orders WHERE status = 'PENDING' ORDER BY created_at ASC")
    .all() as OrderRow[];
}

export function getAllOrders(limit = 100): OrderRow[] {
  return getDb()
    .prepare("SELECT * FROM orders ORDER BY created_at DESC LIMIT ?")
    .all(limit) as OrderRow[];
}

export function logEvent(level: string, message: string, orderId?: string): void {
  getDb().prepare("INSERT INTO event_log (level, message, order_id) VALUES (?,?,?)").run(
    level,
    message,
    orderId ?? null
  );
}
