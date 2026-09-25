import { NextResponse } from "next/server";
import { getPanelServer } from "@/lib/panelServerStore";
import { createHmac, randomBytes } from "crypto";
import { calculateRenewPrice } from "@/lib/panelPricing";

const RENEW_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  try {
    const server = await getPanelServer(orderId);

    if (!server) {
      return NextResponse.json(
        { message: "Server tidak ditemukan" },
        { status: 404 }
      );
    }

    const price = calculateRenewPrice(server.ram, server.disk, server.cpu);

    return NextResponse.json({
      server,
      renewPrice: price,
      duration: RENEW_DURATION_MS,
      durationDays: 30
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil data server";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;

  try {
    const server = await getPanelServer(orderId);

    if (!server) {
      return NextResponse.json(
        { message: "Server tidak ditemukan" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { customerName, customerEmail, customerPhone } = body;

    if (!customerName || !customerEmail || !customerPhone) {
      return NextResponse.json(
        { message: "Nama, email, dan nomor WhatsApp wajib diisi" },
        { status: 400 }
      );
    }

    const price = calculateRenewPrice(server.ram, server.disk, server.cpu);
    const uniqueCode = parseInt(randomBytes(2).toString("hex"), 16) % 1000;
    const totalAmount = price + uniqueCode;

    const tokenPayload = {
      orderId,
      type: "renew",
      customerName,
      customerEmail,
      customerPhone,
      serverName: server.serverName,
      amount: totalAmount,
      uniqueCode,
      createdAt: Date.now(),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000
    };

    const secret = process.env.JWT_SECRET || "default-secret";
    const signature = createHmac("sha256", secret)
      .update(JSON.stringify(tokenPayload))
      .digest("hex");

    const token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64") + "." + signature;

    return NextResponse.json({
      token,
      orderId,
      amount: totalAmount,
      uniqueCode,
      paymentUrl: `/pay/${token}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat order perpanjangan";
    return NextResponse.json({ message }, { status: 500 });
  }
}
