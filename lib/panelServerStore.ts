/**
 * Catatan server panel pelanggan yang sudah dibuat (untuk halaman My Servers
 * dan perpanjangan). Disimpan di tabel orders SQLite — tidak perlu Mongo.
 */
import { getDb, getOrderById } from "./db";

export type PanelServerRecord = {
  orderId: string;
  serverName: string;
  username: string | null;
  email: string | null;
  phone: string | null;
  pterodactylServerId: number | null;
  panelUrl: string | null;
  ram: number;
  disk: number;
  cpu: number;
  eggId: number;
  eggName: string;
  createdAt: number;
  expiresAt: number;
  renewedCount: number;
};

function toRecord(row: any): PanelServerRecord | null {
  if (!row) return null;
  let selection: any = {};
  try {
    selection = JSON.parse(row.server_config || "{}");
  } catch {
    /* empty */
  }
  return {
    orderId: row.id,
    serverName: row.product_title || row.panel_server_name || row.id,
    username: row.panel_username,
    email: row.panel_email,
    phone: row.customer_phone,
    pterodactylServerId: row.panel_server_id,
    panelUrl: (row.panel_url as string) || null,
    ram: Number(selection.ram || 0),
    disk: Number(selection.disk || 0),
    cpu: Number(selection.cpu || 0),
    eggId: Number(selection.eggId || 0),
    eggName: (selection.eggName as string) || "",
    createdAt: new Date(row.created_at + "Z").getTime() || Date.now(),
    expiresAt: new Date((row.expires_at || row.created_at) + "Z").getTime() || Date.now(),
    renewedCount: Number(row.renewed_count || 0)
  };
}

export function getPanelServer(orderId: string): PanelServerRecord | null {
  const row = getDb().prepare("SELECT * FROM orders WHERE id = ?").get(orderId);
  return toRecord(row);
}

export function searchPanelServers(query: string): PanelServerRecord[] {
  const q = `%${query.trim().toLowerCase()}%`;
  const rows = getDb()
    .prepare(
      `SELECT * FROM orders
       WHERE kind = 'panel' AND panel_server_id IS NOT NULL
         AND (LOWER(customer_email) LIKE ? OR panel_username LIKE ? OR product_title LIKE ?)
       ORDER BY created_at DESC`
    )
    .all(q, q, q);
  return rows.map(toRecord).filter(Boolean) as PanelServerRecord[];
}

export function getExpiredPanelServers(): PanelServerRecord[] {
  const now = new Date().toISOString().slice(0, 19).replace("T", " ");
  const rows = getDb()
    .prepare(
      `SELECT * FROM orders
       WHERE kind = 'panel' AND panel_server_id IS NOT NULL
         AND expires_at IS NOT NULL AND expires_at < ?`
    )
    .all(now);
  return rows.map(toRecord).filter(Boolean) as PanelServerRecord[];
}

export function deletePanelServer(orderId: string): void {
  getDb()
    .prepare("UPDATE orders SET panel_server_id = NULL, updated_at = datetime('now') WHERE id = ?")
    .run(orderId);
}

export function renewPanelServer(orderId: string, durationDays: number): PanelServerRecord | null {
  const rec = getPanelServer(orderId);
  if (!rec) return null;
  const newExpiry = new Date(Math.max(rec.expiresAt, Date.now()) + durationDays * 86400000);
  const iso = newExpiry.toISOString().slice(0, 19).replace("T", " ");
  getDb()
    .prepare(
      "UPDATE orders SET expires_at = ?, renewed_count = renewed_count + 1, updated_at = datetime('now') WHERE id = ?"
    )
    .run(iso, orderId);
  return getPanelServer(orderId);
}

export function savePanelServer(input: {
  orderId: string;
  serverName: string;
  username: string;
  phone?: string;
  email?: string;
  pterodactylServerId: number | string;
  panelUrl: string;
  ram: number;
  disk: number;
  cpu: number;
  eggId: number;
  eggName: string;
  expiresAt: number;
}): void {
  const existing = getOrderById(input.orderId);
  const selection = {
    ram: input.ram,
    disk: input.disk,
    cpu: input.cpu,
    eggId: input.eggId,
    eggName: input.eggName
  };
  const iso = new Date(input.expiresAt).toISOString().slice(0, 19).replace("T", " ");
  if (existing) {
    getDb()
      .prepare(
        `UPDATE orders SET
           panel_server_id = ?, panel_username = ?, panel_email = ?, server_config = ?,
           product_title = ?, expires_at = ?, updated_at = datetime('now')
         WHERE id = ?`
      )
      .run(
        Number(input.pterodactylServerId),
        input.username,
        input.email ?? null,
        JSON.stringify(selection),
        input.serverName,
        iso,
        input.orderId
      );
  }
}
