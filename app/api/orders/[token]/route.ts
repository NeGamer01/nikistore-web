import { NextResponse } from "next/server";
import { checkPayment } from "@/lib/paygateway";
import {
  isPanelOrder,
  isPaymentExpired,
  verifyOrderToken,
  type OrderPayload,
  type PanelOrderPayload
} from "@/lib/orders";
import { getProductById } from "@/lib/products";
import {
  createServer,
  createUser,
  isPterodactylConfigured
} from "@/lib/pterodactyl";
import {
  getOrderById,
  saveOrder,
  logEvent,
  getSetting
} from "@/lib/db";

export const runtime = "nodejs";

/**
 * GET /api/orders/{token}
 * Dipanggil PaymentWatcher (polling) tiap beberapa detik.
 *
 * Flow:
 *  1. Verify token (HMAC signed, berisi data order).
 *  2. Cek status invoice di PayGateway (GET /api/v1/qris/{id}).
 *  3. Kalau PAID:
 *     - order panel -> buat user + server Pterodactyl langsung, sekali saja
 *       (idempotent: cek dulu apakah server sudah pernah dibuat untuk order ini).
 *     - order source -> kembalikan link download.
 */
export async function GET(req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const decodedToken = decodeURIComponent(token);
  let order: OrderPayload;
  try {
    order = verifyOrderToken(decodedToken);
  } catch {
    return NextResponse.json({ status: "error", message: "Token order tidak valid." }, { status: 400 });
  }

  try {
    const payment = await checkPayment(order);
    if (!payment.paid) {
      if (isPaymentExpired(order)) {
        return NextResponse.json({ status: "expired", message: "Invoice kedaluwarsa." });
      }
      return NextResponse.json({
        status: "pending",
        message: payment.reason === "missing_config" ? "Payment config belum aktif." : "Belum ada pembayaran masuk."
      });
    }

    // ── PAID ──
    logEvent("INFO", `Pembayaran terdeteksi untuk order ${order.id}`, order.id);
    saveOrder({ id: order.id, status: "PAID", paidAt: new Date().toISOString().slice(0, 19).replace("T", " ") });

    if (isPanelOrder(order)) {
      return await handlePanelOrder(order);
    }

    // ── produk digital (source code) ──
    const product = getProductById(order.productId);
    if (!product) {
      return NextResponse.json({ status: "error", message: "Produk tidak ditemukan." }, { status: 404 });
    }
    const downloadPath = `/api/download/${encodeURIComponent(decodedToken)}`;
    return NextResponse.json({ status: "paid", kind: "source", downloadUrl: downloadPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal cek pembayaran.";
    logEvent("ERROR", `Order ${order.id}: ${message}`, order.id);
    return NextResponse.json({ status: "error", message }, { status: 502 });
  }
}

async function handlePanelOrder(order: PanelOrderPayload) {
  // Idempotent: jangan buat server dua kali untuk order yang sama.
  const existing = getOrderById(order.id);
  if (existing?.panel_server_id) {
    return NextResponse.json({
      status: "paid",
      kind: "panel",
      panel: {
        panelUrl: getSetting("ptero_url") || process.env.PTERO_URL,
        username: existing.panel_username,
        email: existing.panel_email,
        serverId: existing.panel_server_id
      }
    });
  }

  if (!isPterodactylConfigured()) {
    logEvent("WARN", `Order ${order.id}: panel belum dikonfigurasi (PTERO_URL/PTERO_API_KEY)`, order.id);
    return NextResponse.json({
      status: "paid_pending_panel",
      message: "Pembayaran berhasil. Server sedang dibuat, mohon tunggu sebentar..."
    });
  }

  try {
    // 1. Buat user di panel (idempotent by email).
    const user = await createUser({
      email: order.customerEmail,
      username: order.panel.username,
      password: order.panel.password
    });

    // 2. Ambil config egg dari data/eggs.json (dipilih saat order).
    const egg = getEggConfig(order.panel.eggId);
    if (!egg) {
      throw new Error(`Konfigurasi egg ${order.panel.eggId} tidak ditemukan di data/eggs.json`);
    }

    // 3. Buat server.
    const server = await createServer({
      name: order.panel.serverName,
      userId: user.id,
      eggId: order.panel.eggId,
      dockerImage: egg.dockerImage,
      startup: egg.startup,
      environment: egg.environment || {},
      memoryMb: order.panel.selection.ram,
      diskMb: order.panel.selection.disk,
      cpuPercent: order.panel.selection.cpu
    });

    // 4. Simpan hasil ke DB.
    saveOrder({
      id: order.id,
      panelServerId: server.id,
      panelUsername: user.username,
      panelEmail: user.email,
      panelPassword: order.panel.password
    });
    logEvent("INFO", `Server ${server.name} (id ${server.id}) dibuat untuk order ${order.id}`, order.id);

    return NextResponse.json({
      status: "paid",
      kind: "panel",
      panel: {
        panelUrl: server.panelUrl,
        username: user.username,
        email: user.email,
        password: order.panel.password,
        serverId: server.id
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat server.";
    logEvent("ERROR", `Order ${order.id}: gagal membuat server: ${message}`, order.id);
    return NextResponse.json(
      {
        status: "paid_panel_failed",
        message: `Pembayaran berhasil, tapi gagal membuat server: ${message}`
      },
      { status: 502 }
    );
  }
}

type EggConfig = {
  id: number;
  dockerImage: string;
  startup: string;
  environment?: Record<string, string>;
};

function getEggConfig(eggId: number): EggConfig | null {
  try {
    const eggs = require("@/data/eggs.json") as EggConfig[];
    return eggs.find((e) => e.id === eggId) ?? null;
  } catch {
    return null;
  }
}
