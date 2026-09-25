import { deletePanelServer, getExpiredPanelServers } from "@/lib/panelServerStore";
import { deleteServer } from "@/lib/pterodactyl";
import { logEvent } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/cron/cleanup
 * Dipanggil cron (Vercel cron / cPanel cron) tiap jam untuk menghapus
 * server panel pelanggan yang sudah expired.
 * Auth: header Authorization: Bearer <CRON_SECRET>
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const expired = getExpiredPanelServers();
    const deleted: Array<{
      orderId: string;
      serverName: string;
      pterodactylServerId: number | null;
      deleted: boolean;
      error?: string;
    }> = [];

    for (const server of expired) {
      let ok = false;
      let error: string | undefined;

      try {
        if (server.pterodactylServerId) {
          await deleteServer(server.pterodactylServerId);
        }
        deletePanelServer(server.orderId);
        ok = true;
        logEvent("INFO", `Server ${server.serverName} (order ${server.orderId}) expired & dihapus`);
      } catch (err) {
        error = err instanceof Error ? err.message : "Unknown error";
        logEvent("ERROR", `Gagal hapus server expired ${server.orderId}: ${error}`, server.orderId);
      }

      deleted.push({
        orderId: server.orderId,
        serverName: server.serverName,
        pterodactylServerId: server.pterodactylServerId,
        deleted: ok,
        error
      });
    }

    return new Response(
      JSON.stringify({ success: true, deleted: deleted.length, details: deleted }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Cron cleanup error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
