import { NextResponse } from "next/server";
import { setPanelOrdersEnabled } from "@/lib/panelSettings";
import { isAdminAuthenticated } from "@/lib/adminAuth";

export const runtime = "nodejs";

export async function PUT(req: Request) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (typeof body?.enabled !== "boolean") {
    return NextResponse.json({ message: "Field 'enabled' (boolean) wajib." }, { status: 400 });
  }
  try {
    await setPanelOrdersEnabled(body.enabled);
    return NextResponse.json({ enabled: body.enabled });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update setting.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
