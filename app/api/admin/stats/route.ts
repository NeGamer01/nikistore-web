import { NextResponse } from "next/server";
import { getOrderStats } from "@/lib/orderStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const stats = await getOrderStats();
    return NextResponse.json(stats);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil statistik.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
