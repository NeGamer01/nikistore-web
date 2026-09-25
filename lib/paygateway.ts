import type { OrderPayload } from "./orders";

/**
 * Payment gateway: PayGateway (pay.halogamingzone.com)
 * Menggantikan Okepay. Flow:
 *   1. POST /api/v1/qris            -> buat invoice, dapat qris_id
 *   2. GET  /api/v1/qris/{id}       -> polling status (PAID/PENDING)
 *   3. (opsional) webhook HMAC      -> notifikasi pembayaran masuk
 *
 * API key dibaca dari DB settings (admin panel) atau env PAYGW_API_KEY.
 */

export type QrisPayment = {
  qrisId: string;
  qrisUrl: string;
  qrisString?: string;
  trxId?: string;
};

export type PaymentCheck =
  | { paid: true; raw: unknown }
  | { paid: false; reason: "pending" | "expired" | "missing_config" };

const DEFAULT_BASE_URL = "https://pay.halogamingzone.com";

function getBaseUrl(): string {
  return (process.env.PAYGW_URL || DEFAULT_BASE_URL).replace(/\/$/, "");
}

export async function getApiKey(): Promise<string> {
  // Prefer dari DB settings (bisa diedit dari admin panel tanpa redeploy).
  try {
    const { getSetting } = await import("./db");
    const fromDb = await getSetting("paygw_api_key");
    if (fromDb) return fromDb;
  } catch {
    /* db belum siap — fallback ke env */
  }
  return process.env.PAYGW_API_KEY || "";
}

export function isPaygatewayConfigured(): boolean {
  return Boolean(process.env.PAYGW_URL || DEFAULT_BASE_URL) && true;
}

async function api<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const key = await getApiKey();
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "x-api-key": key,
      ...(init.headers || {})
    },
    cache: "no-store"
  });

  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`PayGateway response bukan JSON: ${text.slice(0, 120)}`);
  }

  if (!res.ok) {
    const code = json?.code || json?.error || `HTTP_${res.status}`;
    const msg = json?.message || json?.error || `PayGateway error ${res.status}`;
    throw new Error(`PayGateway ${code}: ${msg}`);
  }
  return json as T;
}

type CreateInvoiceResponse = {
  qris_id: string;
  trx_id?: string;
  reference?: string;
  amount: number;
  callback_url?: string;
  attributes?: { qris_string?: string; qr_url?: string } | null;
};

/**
 * Buat invoice QRIS. callback_url dipakai PayGateway untuk kirim webhook
 * saat pembayaran masuk. Gunakan route publik (/api/webhook/paygateway).
 */
export async function createQrisPayment(
  amount: number,
  reference: string,
  callbackUrl?: string
): Promise<QrisPayment> {
  const key = await getApiKey();
  if (!key) {
    throw new Error(
      "PAYGW_API_KEY belum diset. Isi di halaman admin > Settings, atau set env PAYGW_API_KEY."
    );
  }

  const siteUrl = process.env.SITE_URL || "";
  const finalCallback = callbackUrl || `${siteUrl.replace(/\/$/, "")}/api/webhook/paygateway`;

  const json = await api<CreateInvoiceResponse>("/api/v1/qris", {
    method: "POST",
    body: JSON.stringify({ amount, reference, callback_url: finalCallback })
  });

  const qrisString = json.attributes?.qris_string || undefined;
  const qrUrl =
    json.attributes?.qr_url ||
    `${getBaseUrl()}/qr/${json.qris_id}?format=raw`;

  return {
    qrisId: json.qris_id,
    trxId: json.trx_id,
    qrisUrl: qrUrl,
    qrisString
  };
}

type CheckStatusResponse = {
  qris_id: string;
  reference?: string;
  amount?: number;
  paid?: boolean;
  status?: string;
  message?: string;
};

export async function checkPayment(order: OrderPayload): Promise<PaymentCheck> {
  const key = await getApiKey();
  if (!key) return { paid: false, reason: "missing_config" };

  const qrisId = order.qrisId;
  if (!qrisId) return { paid: false, reason: "missing_config" };

  try {
    const json = await api<CheckStatusResponse>(`/api/v1/qris/${qrisId}`);
    const paid = json.paid === true || String(json.status || "").toUpperCase() === "PAID";
    if (paid) return { paid: true, raw: json };
    if (String(json.status || "").toUpperCase() === "EXPIRED") {
      return { paid: false, reason: "expired" };
    }
    return { paid: false, reason: "pending" };
  } catch (error) {
    // Jangan lempar error ke polling — biarkan retry di tick berikutnya.
    console.error("PayGateway checkPayment gagal:", (error as Error).message);
    return { paid: false, reason: "pending" };
  }
}

/**
 * Verifikasi signature webhook. PayGateway mengirim HMAC sha256
 * atas raw body dengan X-Webhook-Signature header.
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
  const secret =
    process.env.PAYGW_WEBHOOK_SECRET ||
    process.env.PAYGW_API_KEY ||
    process.env.ORDER_SIGNING_SECRET ||
    "";
  if (!secret) return false;
  const expected = createHmacSha256(secret, body);
  return safeEqualHex(expected, signature);
}

function createHmacSha256(secret: string, body: string): string {
  return crypto.createHmac("sha256", secret).update(body).digest("hex");
}

function safeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
}

import * as crypto from "crypto";
