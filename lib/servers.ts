/**
 * Daftar node/server Pterodactyl yang tersedia. Konfigurasi ada di
 * data/servers.json. Kuota (maxPanels) dihitung dari jumlah order panel
 * yang sudah punya panel_server_id di SQLite.
 */
import serverData from "@/data/servers.json";
import { getDb } from "./db";

export type ServerConfig = {
  id: string;
  name: string;
  location: string;
  panelUrl: string;
  locationId: number;
  nestId: number;
  eggId: number;
  maxPanels: number;
};

export type ServerAvailability = {
  config: ServerConfig;
  used: number;
  remaining: number;
  full: boolean;
};

export const servers = serverData as ServerConfig[];

export function getServerById(id: string): ServerConfig | undefined {
  return servers.find((s) => s.id === id);
}

export function isServerAvailable(id: string): boolean {
  const cfg = getServerById(id);
  if (!cfg) return false;
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM orders WHERE kind = 'panel' AND panel_server_id IS NOT NULL")
    .get() as { n: number };
  return row.n < cfg.maxPanels;
}

export function getServerAvailability(): ServerAvailability[] {
  return servers.map((config) => {
    const row = getDb()
      .prepare("SELECT COUNT(*) AS n FROM orders WHERE kind = 'panel' AND panel_server_id IS NOT NULL")
      .get() as { n: number };
    const used = row.n;
    return {
      config,
      used,
      remaining: Math.max(0, config.maxPanels - used),
      full: used >= config.maxPanels
    };
  });
}
