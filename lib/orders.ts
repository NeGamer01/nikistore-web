import { createHmac, randomInt, randomUUID, timingSafeEqual } from "crypto";
import type { PanelSelection } from "./panelPricing";
import { getProductPrice, type Product } from "./products";

export type PanelOrderInfo = {
  username: string;
  password: string;
  selection: PanelSelection;
  serverName: string;
  serverId: string;
  eggId: number;
  eggName: string;
};

export type SourceOrderPayload = {
  v: 1;
  id: string;
  kind: "source";
  productId: string;
  productSlug: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  basePrice: number;
  uniqueCode: number;
  amount: number;
  qrisId?: string;
  createdAt: number;
  paymentExpiresAt: number;
  downloadExpiresAt: number;
};

export type PanelOrderPayload = {
  v: 1;
  id: string;
  kind: "panel";
  productId: "panel-custom";
  productSlug: "panel-custom";
  productTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  basePrice: number;
  uniqueCode: number;
  amount: number;
  qrisId?: string;
  createdAt: number;
  paymentExpiresAt: number;
  downloadExpiresAt: number;
  panel: PanelOrderInfo;
};

export type OrderPayload = SourceOrderPayload | PanelOrderPayload;

const PAYMENT_TTL_MS = 30 * 60 * 1000;
const DOWNLOAD_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function getSigningSecret() {
  const secret = process.env.ORDER_SIGNING_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("ORDER_SIGNING_SECRET belum diset.");
  }
  return "dev-only-change-this-secret";
}

function signBody(body: string) {
  return createHmac("sha256", getSigningSecret()).update(body).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  return a.length === b.length && timingSafeEqual(a, b);
}

function genId() {
  return `ORD-${randomUUID().slice(0, 8).toUpperCase()}`;
}

function freshUniqueCode() {
  return randomInt(21, 497);
}

function encode(payload: OrderPayload) {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return { payload, token: `${body}.${signBody(body)}` };
}

function saveOrderSync(payload: OrderPayload) {
  // SQLite (cPanel) — menggantikan MongoDB Atlas.
  try {
    const { saveOrder } = require("./db");
    saveOrder(payload);
  } catch (error) {
    console.error("Failed to save order to SQLite:", error);
  }
}

export function createOrderToken(
  product: Product,
  customer: { name: string; email: string; phone: string }
) {
  const createdAt = Date.now();
  const uniqueCode = freshUniqueCode();
  const price = getProductPrice(product);
  const payload: SourceOrderPayload = {
    v: 1,
    id: genId(),
    kind: "source",
    productId: product.id,
    productSlug: product.slug,
    customerName: customer.name.trim().slice(0, 80),
    customerEmail: customer.email.trim().toLowerCase().slice(0, 120),
    customerPhone: customer.phone.trim().slice(0, 24),
    basePrice: price,
    uniqueCode,
    amount: price + uniqueCode,
    createdAt,
    paymentExpiresAt: createdAt + PAYMENT_TTL_MS,
    downloadExpiresAt: createdAt + DOWNLOAD_TTL_MS
  };
  const result = encode(payload);
  saveOrderSync(payload);
  return result;
}

export function createPanelOrderToken(
  customer: { name: string; email: string; phone: string },
  panel: PanelOrderInfo,
  basePrice: number
) {
  const createdAt = Date.now();
  const uniqueCode = freshUniqueCode();
  const payload: PanelOrderPayload = {
    v: 1,
    id: genId(),
    kind: "panel",
    productId: "panel-custom",
    productSlug: "panel-custom",
    productTitle: `Panel ${panel.serverName}`,
    customerName: customer.name.trim().slice(0, 80),
    customerEmail: customer.email.trim().toLowerCase().slice(0, 120),
    customerPhone: customer.phone.trim().slice(0, 24),
    basePrice,
    uniqueCode,
    amount: basePrice + uniqueCode,
    createdAt,
    paymentExpiresAt: createdAt + PAYMENT_TTL_MS,
    downloadExpiresAt: createdAt + DOWNLOAD_TTL_MS,
    panel
  };
  const result = encode(payload);
  saveOrderSync(payload);
  return result;
}

export function verifyOrderToken(token: string): OrderPayload {
  const [body, signature] = token.split(".");
  if (!body || !signature) throw new Error("Token order tidak valid.");

  const expected = signBody(body);
  if (!safeEqual(signature, expected)) throw new Error("Signature order tidak valid.");

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as OrderPayload;
  if (
    payload.v !== 1 ||
    !payload.id ||
    !payload.productId ||
    !payload.productSlug ||
    !payload.amount ||
    !payload.paymentExpiresAt
  ) {
    throw new Error("Payload order tidak valid.");
  }
  if (!payload.kind) (payload as SourceOrderPayload).kind = "source";
  return payload;
}

export function isPaymentExpired(order: OrderPayload) {
  return Date.now() > order.paymentExpiresAt;
}

export function isDownloadExpired(order: OrderPayload) {
  return Date.now() > order.downloadExpiresAt;
}

export function isPanelOrder(order: OrderPayload): order is PanelOrderPayload {
  return order.kind === "panel";
}
