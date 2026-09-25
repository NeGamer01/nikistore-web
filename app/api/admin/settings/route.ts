import { NextResponse } from "next/server";
import { getAllSettings, setSetting } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/adminAuth";
import { isPterodactylConfigured } from "@/lib/pterodactyl";
import { getApiKey } from "@/lib/paygateway";

export const runtime = "nodejs";

/**
 * GET /api/admin/settings
 * Ambil semua settings (PayGateway + Pterodactyl config).
 */
export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const settings = getAllSettings();
  return NextResponse.json({
    settings: {
      paygw_url: settings.paygw_url || process.env.PAYGW_URL || "https://pay.halogamingzone.com",
      paygw_api_key: settings.paygw_api_key || "",
      ptero_url: settings.ptero_url || process.env.PTERO_URL || "",
      ptero_api_key: settings.ptero_api_key || "",
      ptero_node_id: settings.ptero_node_id || process.env.PTERO_NODE_ID || "1",
      panelEnabled: settings.panelEnabled || "true"
    },
    status: {
      paygateway: Boolean(settings.paygw_api_key || process.env.PAYGW_API_KEY),
      pterodactyl: isPterodactylConfigured()
    }
  });
}

/**
 * PUT /api/admin/settings
 * Update settings. API key PayGateway & Pterodactyl disimpan di DB.
 */
export async function PUT(req: Request) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ message: "Body tidak valid." }, { status: 400 });
  }

  const allowed = [
    "paygw_url",
    "paygw_api_key",
    "ptero_url",
    "ptero_api_key",
    "ptero_node_id",
    "panelEnabled"
  ];

  const updated: string[] = [];
  for (const key of allowed) {
    const value = body[key];
    if (value === undefined) continue;
    if (typeof value !== "string") continue;
    // Jangan timpa key yang sudah ada dengan string kosong.
    if (!value && (key === "paygw_api_key" || key === "ptero_api_key")) continue;
    setSetting(key, value);
    updated.push(key);
  }

  return NextResponse.json({ updated, settings: getAllSettings() });
}

/**
 * POST /api/admin/settings/test-paygw
 * Tes koneksi PayGateway — bikin invoice dummy Rp 1000 lalu langsung cek.
 */
export async function POST(req: Request) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const key = await getApiKey();
    if (!key) {
      return NextResponse.json({
        success: false,
        message: "PAYGW_API_KEY belum diset."
      });
    }

    const { createQrisPayment, checkPayment } = await import("@/lib/paygateway");
    const inv = await createQrisPayment(1000, `test-${Date.now()}`);
    return NextResponse.json({
      success: true,
      message: `Koneksi PayGateway OK. Invoice test: ${inv.qrisId}`,
      qrisId: inv.qrisId
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal tes koneksi.";
    return NextResponse.json({ success: false, message }, { status: 502 });
  }
}
