import { NextResponse } from "next/server";
import { getOrders } from "@/lib/orderStore";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") as "pending" | "paid" | "expired" | null;
  const kind = searchParams.get("kind") as "source" | "panel" | null;
  const search = searchParams.get("search");

  try {
    const orders = await getOrders({
      status: status || undefined,
      kind: kind || undefined,
      search: search || undefined
    });
    return NextResponse.json({ orders });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil orders.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
