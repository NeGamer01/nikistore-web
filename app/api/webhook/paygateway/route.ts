import { NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/paygateway";
import { logEvent } from "@/lib/db";

export const runtime = "nodejs";

/**
 * POST /api/webhook/paygateway
 * PayGateway memanggil endpoint ini saat pembayaran masuk.
 * Signature: HMAC sha256 atas raw body, dikirim di header X-Webhook-Signature.
 */
export async function POST(req: Request) {
  try {
    const raw = await req.text();
    const signature = req.headers.get("x-webhook-signature") || req.headers.get("X-Webhook-Signature") || "";

    if (!signature) {
      return NextResponse.json({ success: false, message: "Signature webhook tidak ada." }, { status: 401 });
    }

    if (!verifyWebhookSignature(raw, signature)) {
      logEvent("WARN", "Webhook PayGateway ditolak: signature tidak cocok.");
      return NextResponse.json({ success: false, message: "Signature tidak valid." }, { status: 401 });
    }

    const body = JSON.parse(raw);
    const qrisId: string | undefined = body?.qris_id || body?.data?.qris_id;
    const status: string = String(body?.status || body?.data?.status || "").toUpperCase();

    if (!qrisId) {
      return NextResponse.json({ success: true, message: "OK (tidak ada qris_id)" });
    }

    if (status === "PAID" || body?.paid === true) {
      logEvent("INFO", `Webhook: pembayaran untuk ${qrisId}`);
      // Tidak perlu melakukan apa-apa di sini — PaymentWatcher customer
      // akan cek status invoice dan memicu provision server.
      // (Cron cleanup juga polling sebagai fallback.)
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Webhook gagal.";
    logEvent("ERROR", `Webhook PayGateway error: ${message}`);
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
