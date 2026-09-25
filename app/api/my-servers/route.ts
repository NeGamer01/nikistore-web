import { NextResponse } from "next/server";
import { searchPanelServers } from "@/lib/panelServerStore";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";

  if (!query.trim()) {
    return NextResponse.json({ servers: [] });
  }

  try {
    const servers = await searchPanelServers(query);
    return NextResponse.json({ servers });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mencari server.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
