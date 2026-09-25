import { NextResponse } from "next/server";
import { getOrders } from "@/lib/orderStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const orders = await getOrders({ kind: "panel" });
    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil panel orders.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
