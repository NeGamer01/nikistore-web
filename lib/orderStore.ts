/**
 * Order store — shim SQLite menggantikan MongoDB.
 * Dipakai endpoint admin untuk membaca/memperbarui status order.
 */
import { getAllOrders, getOrderById, saveOrder, getOrdersByEmail, getDb } from "./db";

// ── orders ──
export { getAllOrders, getOrderById };

export function getOrders(filter?: {
  status?: string;
  kind?: string;
  search?: string;
}): any[] {
  const db = getDb();
  const where: string[] = [];
  const params: any[] = [];

  if (filter?.status) {
    where.push("UPPER(status) = UPPER(?)");
    params.push(filter.status);
  }
  if (filter?.kind) {
    where.push("kind = ?");
    params.push(filter.kind);
  }
  if (filter?.search) {
    where.push("(LOWER(customer_email) LIKE ? OR LOWER(customer_name) LIKE ? OR id LIKE ?)");
    const q = `%${filter.search.toLowerCase()}%`;
    params.push(q, q, q);
  }

  const sql = where.length
    ? `SELECT * FROM orders WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT 200`
    : `SELECT * FROM orders ORDER BY created_at DESC LIMIT 200`;
  return db.prepare(sql).all(...params) as any[];
}

export function getOrderStats(): {
  total: number;
  paid: number;
  pending: number;
  revenue: number;
} {
  const db = getDb();
  const total = (db.prepare("SELECT COUNT(*) AS n FROM orders").get() as { n: number }).n;
  const paid = (
    db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'PAID'").get() as { n: number }
  ).n;
  const pending = (
    db.prepare("SELECT COUNT(*) AS n FROM orders WHERE status = 'PENDING'").get() as { n: number }
  ).n;
  const revenue = (
    db.prepare("SELECT COALESCE(SUM(amount), 0) AS s FROM orders WHERE status = 'PAID'").get() as {
      s: number;
    }
  ).s;
  return { total, paid, pending, revenue };
}

export function updateOrderStatus(orderId: string, status: string): void {
  const row = getOrderById(orderId);
  if (!row) return;
  saveOrder({
    id: orderId,
    status,
    paidAt: status === "PAID" ? new Date().toISOString().slice(0, 19).replace("T", " ") : undefined
  });
}

export type AdminOrderView = {
  id: string;
  kind: string;
  productTitle: string | null;
  customerName: string | null;
  customerEmail: string | null;
  amount: number;
  status: string;
  qrisId: string | null;
  panelServerId: number | null;
  createdAt: string;
  paidAt: string | null;
};

export function listAdminOrders(limit = 100): AdminOrderView[] {
  return getAllOrders(limit).map((row) => ({
    id: row.id,
    kind: row.kind,
    productTitle: row.product_title,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    amount: row.amount,
    status: row.status,
    qrisId: row.qris_id,
    panelServerId: row.panel_server_id,
    createdAt: row.created_at,
    paidAt: row.paid_at
  }));
}
