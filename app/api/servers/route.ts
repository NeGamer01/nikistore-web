import { NextResponse } from "next/server";
import { getServerAvailability } from "@/lib/servers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const list = await getServerAvailability();
    return NextResponse.json({
      servers: list.map((s) => ({
        id: s.config.id,
        name: s.config.name,
        location: s.config.location,
        used: s.used,
        max: s.config.maxPanels,
        remaining: s.remaining,
        full: s.full
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal load server.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
