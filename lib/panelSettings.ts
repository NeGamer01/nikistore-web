/**
 * Panel settings — shim SQLite. Pengaturan panel disimpan di tabel settings.
 */
import { getAllSettings, getSetting, setSetting } from "./db";

export { getAllSettings, getSetting, setSetting };

export const DEFAULT_PANEL_SETTINGS = {
  panelEnabled: "true",
  defaultRam: "1024",
  defaultDisk: "1024",
  defaultCpu: "60"
};

export function getPanelSettings(): Record<string, string> {
  const stored = getAllSettings();
  return { ...DEFAULT_PANEL_SETTINGS, ...stored };
}

export function getPanelOrdersEnabled(): boolean {
  return getSetting("panelEnabled") !== "false" && process.env.NEXT_PUBLIC_PANEL_ORDERS_ENABLED !== "false";
}

export function setPanelOrdersEnabled(enabled: boolean): void {
  setSetting("panelEnabled", enabled ? "true" : "false");
}
