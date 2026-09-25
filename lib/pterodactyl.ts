/**
 * Pterodactyl Application API client — DIPANGGIL LANGSUNG dari webstore.
 * Tidak perlu wrapper API eksternal seperti project lama.
 *
 * Yang dibutuhkan (set di admin panel > Settings):
 *   PTERO_URL       https://panel.domainkamu.com
 *   PTERO_API_KEY   ptla_xxx  (Application API key dari panel)
 *   PTERO_NODE_ID   1
 *
 * Catatan penting (panel v1.11+, hasil pengalaman):
 *   - POST /api/application/servers TIDAK menerima "deploy" object.
 *   - allocation.default harus ID allocation yang SUDAH ADA dan belum
 *     di-assign (dari GET /nodes/{id}/allocations), bukan jumlah port.
 *   - User harus dibuat dulu via POST /api/application/users, lalu
 *     id-nya dipakai di field "user".
 */
import { getSetting } from "./db";

function baseUrl(): string {
  return (getSetting("ptero_url") || process.env.PTERO_URL || "").replace(/\/$/, "");
}

function apiKey(): string {
  return getSetting("ptero_api_key") || process.env.PTERO_API_KEY || "";
}

export function isPterodactylConfigured(): boolean {
  return Boolean(baseUrl() && apiKey());
}

export type PteroUser = {
  id: number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
};

export type PteroServer = {
  id: number;
  uuid: string;
  name: string;
  username?: string;
  email?: string;
  panelUrl: string;
  allocationIp: string;
  allocationPort: number | null;
};

async function pteroApi<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const url = `${baseUrl()}${path}`;
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers || {})
    },
    cache: "no-store"
  });
  const text = await res.text();
  let json: any;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`Panel response bukan JSON: ${text.slice(0, 120)}`);
  }
  if (!res.ok) {
    const detail =
      json?.errors?.[0]?.detail || json?.message || `Panel API ${res.status}`;
    const code = json?.errors?.[0]?.code || "";
    throw new Error(`Panel ${code ? code + ": " : ""}${detail}`);
  }
  return json as T;
}

// ── users ──
export async function findUserByEmail(email: string): Promise<PteroUser | null> {
  const qs = new URLSearchParams({ "filter[email]": email });
  const json = await pteroApi<any>(`/api/application/users?${qs.toString()}`);
  const list = json?.data || [];
  if (list.length === 0) return null;
  return list[0].attributes as PteroUser;
}

export async function createUser(input: {
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  password?: string;
}): Promise<PteroUser> {
  // Cek dulu — panel 409 kalau email/username sudah ada.
  const existing = await findUserByEmail(input.email).catch(() => null);
  if (existing) return existing;

  const json = await pteroApi<any>("/api/application/users", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      username: input.username,
      first_name: input.firstName || input.username,
      last_name: input.lastName || "Customer",
      password: input.password || generatePassword()
    })
  });
  return json.attributes as PteroUser;
}

function generatePassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

// ── allocations ──
export async function findFreeAllocation(nodeId?: number): Promise<number> {
  const id = nodeId ?? Number(getSetting("ptero_node_id") || process.env.PTERO_NODE_ID || 1);
  const qs = new URLSearchParams({ per_page: "250" });
  const json = await pteroApi<any>(
    `/api/application/nodes/${id}/allocations?${qs.toString()}`
  );
  const list: any[] = json?.data || [];
  const free = list.find((a) => !a.attributes.assigned);
  if (!free) {
    throw new Error(
      `Tidak ada port kosong di node ${id}. Tambahkan allocation range baru di panel > Nodes.`
    );
  }
  return free.attributes.id as number;
}

// ── servers ──
export async function createServer(input: {
  name: string;
  userId: number;
  eggId: number;
  nestId?: number;
  dockerImage: string;
  startup: string;
  environment?: Record<string, string>;
  memoryMb: number;
  diskMb: number;
  cpuPercent: number;
  swapMb?: number;
  io?: number;
  databases?: number;
  allocations?: number;
  backups?: number;
}): Promise<PteroServer> {
  const allocationId = await findFreeAllocation();

  const json = await pteroApi<any>("/api/application/servers", {
    method: "POST",
    body: JSON.stringify({
      name: input.name,
      user: input.userId,
      egg: input.eggId,
      docker_image: input.dockerImage,
      startup: input.startup,
      environment: input.environment || {},
      limits: {
        memory: input.memoryMb,
        swap: input.swapMb ?? 0,
        disk: input.diskMb,
        io: input.io ?? 500,
        cpu: input.cpuPercent
      },
      feature_limits: {
        databases: input.databases ?? 1,
        allocations: input.allocations ?? 0,
        backups: input.backups ?? 1
      },
      // JANGAN kirim "deploy" — panel v1.11+ menolaknya.
      allocation: { default: allocationId },
      start_on_completion: true
    })
  });

  const srv = json.attributes || json;
  const alloc = srv?.relationships?.allocations?.data?.[0]?.attributes || {};

  return {
    id: srv.id,
    uuid: srv.uuid,
    name: srv.name,
    panelUrl: baseUrl(),
    allocationIp: alloc.ip || "",
    allocationPort: alloc.port ?? null
  };
}

export async function deleteServer(serverId: number | string): Promise<void> {
  await pteroApi(`/api/application/servers/${serverId}`, { method: "DELETE" });
}

// Alias untuk kompatibilitas dengan kode lama.
export const deletePterodactylServer = deleteServer;

export type PanelCreationSuccess = {
  ok: true;
  panelUrl: string;
  username: string;
  password?: string;
  email?: string;
  serverId?: string | number;
  raw: unknown;
};

export type PanelCreationFailure = {
  ok: false;
  message: string;
  status?: number;
  raw?: unknown;
};

export type PanelCreationResult = PanelCreationSuccess | PanelCreationFailure;

export async function suspendServer(serverId: number | string): Promise<void> {
  await pteroApi(`/api/application/servers/${serverId}/suspend`, { method: "POST" });
}

export async function unsuspendServer(serverId: number | string): Promise<void> {
  await pteroApi(`/api/application/servers/${serverId}/unsuspend`, { method: "POST" });
}

// ── eggs (untuk katalog game) ──
export async function listEggs(nestId: number): Promise<any[]> {
  const qs = new URLSearchParams({ include: "config,script,variables" });
  const json = await pteroApi<any>(
    `/api/application/nests/${nestId}/eggs?${qs.toString()}`
  );
  return (json?.data || []).map((e: any) => e.attributes);
}
