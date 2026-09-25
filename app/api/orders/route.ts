import { NextResponse } from "next/server";
import { createOrderToken } from "@/lib/orders";
import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/phone";
import { getProductById } from "@/lib/products";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const product = getProductById(String(body?.productId || ""));
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const phone = normalizeWhatsAppNumber(String(body?.phone || ""));

  if (!product) {
    return NextResponse.json({ message: "Produk tidak ditemukan." }, { status: 404 });
  }
  if (name.length < 2) {
    return NextResponse.json({ message: "Nama wajib diisi." }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Email tidak valid." }, { status: 400 });
  }
  if (!isValidWhatsAppNumber(phone)) {
    return NextResponse.json({ message: "Nomor WhatsApp tidak valid." }, { status: 400 });
  }

  try {
    const { payload, token } = createOrderToken(product, { name, email, phone });
    return NextResponse.json({
      order: payload,
      token,
      paymentUrl: `/pay/${encodeURIComponent(token)}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat order.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
