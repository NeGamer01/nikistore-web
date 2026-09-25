import { NextResponse } from "next/server";
import { getPanelOrdersEnabled, setPanelOrdersEnabled } from "@/lib/panelSettings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const enabled = await getPanelOrdersEnabled();
    return NextResponse.json({ enabled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membaca setting.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

