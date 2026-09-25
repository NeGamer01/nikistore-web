import { NextResponse } from "next/server";
import { checkPayment } from "@/lib/paygateway";
import { isDownloadExpired, isPanelOrder, verifyOrderToken } from "@/lib/orders";
import { getDownloadUrl, getProductById } from "@/lib/products";

export const runtime = "nodejs";

export async function GET(_req: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let order;
  try {
    order = verifyOrderToken(decodeURIComponent(token));
  } catch {
    return NextResponse.json({ message: "Token order tidak valid." }, { status: 400 });
  }

  if (isPanelOrder(order)) {
    return NextResponse.json({ message: "Panel order tidak punya link download." }, { status: 400 });
  }

  if (isDownloadExpired(order)) {
    return NextResponse.json({ message: "Link download kedaluwarsa." }, { status: 410 });
  }

  const product = getProductById(order.productId);
  if (!product) {
    return NextResponse.json({ message: "Produk tidak ditemukan." }, { status: 404 });
  }

  const payment = await checkPayment(order);
  if (!payment.paid) {
    return NextResponse.json({ message: "Pembayaran belum terverifikasi." }, { status: 402 });
  }

  const downloadUrl = getDownloadUrl(product);
  if (!downloadUrl) {
    return NextResponse.json({ message: `Env ${product.downloadEnvKey} belum diset.` }, { status: 501 });
  }

  return NextResponse.redirect(downloadUrl);
}
