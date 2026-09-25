import { NextResponse } from "next/server";
import { createHmac } from "crypto";
import { renewPanelServer, getPanelServer } from "@/lib/panelServerStore";
import { formatRupiah } from "@/lib/format";

export const runtime = "nodejs";

type RenewToken = {
  orderId: string;
  type: "renew";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serverName: string;
  amount: number;
  uniqueCode: number;
  createdAt: number;
  expiresAt: number;
};

function verifyToken(token: string): RenewToken | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const secret = process.env.JWT_SECRET || "default-secret";
  const expected = createHmac("sha256", secret).update(payloadB64).digest("hex");

  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
    if (payload.type !== "renew") return null;
    if (Date.now() > payload.expiresAt) return null;
    return payload as RenewToken;
  } catch {
    return null;
  }
}

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const decoded = decodeURIComponent(token);

  const renewData = verifyToken(decoded);
  if (!renewData) {
    return NextResponse.json({
      status: "error",
      message: "Token perpanjangan tidak valid atau sudah kadaluarsa."
    });
  }

  const server = getPanelServer(renewData.orderId);
  if (!server) {
    return NextResponse.json({ status: "error", message: "Server tidak ditemukan." });
  }

  try {
    // Untuk perpanjangan: cek pembayaran berdasarkan jumlah unik.
    // RenewWatcher polling GET /api/v1/qris?qris_id=... tidak bisa dipakai
    // karena renew tidak punya qris_id (QR dibuat saat halaman pay).
    // Solusinya: gunakan endpoint mutasi PayGateway (jika ada) atau
    // RenewWatcher cek manual. Untuk sekarang kembalikan pending sampai
    // admin konfirmasi, atau customer melakukan pembayaran ulang via
    // order flow normal.

    // TODO: implementasi cek mutasi renew via PayGateway
    // (butuh endpoint list mutasi di PayGateway, atau simpan qris_id renew
    //  ke DB saat halaman pay dirender).

    return NextResponse.json({
      status: "pending",
      message: "Cek pembayaran perpanjangan via polling PayGateway belum diaktifkan."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal cek pembayaran.";
    return NextResponse.json({ status: "error", message }, { status: 502 });
  }
}
