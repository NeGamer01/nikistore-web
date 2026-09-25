import { NextResponse } from "next/server";
import {
  calculatePanelPrice,
  isValidSelection,
  type PanelSelection
} from "@/lib/panelPricing";
import { createPanelOrderToken } from "@/lib/orders";
import { isValidWhatsAppNumber, normalizeWhatsAppNumber } from "@/lib/phone";
import { getServerById, isServerAvailable } from "@/lib/servers";
import { getEggById, isValidEgg } from "@/lib/eggs";

export const runtime = "nodejs";

const USERNAME_RE = /^[a-zA-Z0-9_]{3,32}$/;
const SERVER_NAME_RE = /^[a-zA-Z0-9 _-]{3,40}$/;

function generatePanelPassword(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#%";
  let out = "";
  for (let i = 0; i < 16; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}

function pickInt(value: unknown) {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : NaN;
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();
  const email = String(body?.email || "").trim().toLowerCase();
  const phone = normalizeWhatsAppNumber(String(body?.phone || ""));
  const username = String(body?.username || "").trim();
  const serverName = String(body?.serverName || "").trim();
  const serverId = String(body?.serverId || "").trim();
  const eggId = pickInt(body?.eggId);

  if (name.length < 2) return NextResponse.json({ message: "Nama wajib diisi." }, { status: 400 });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ message: "Email tidak valid." }, { status: 400 });
  }
  if (!isValidWhatsAppNumber(phone)) {
    return NextResponse.json({ message: "Nomor WhatsApp tidak valid." }, { status: 400 });
  }
  if (!USERNAME_RE.test(username)) {
    return NextResponse.json(
      { message: "Username panel hanya huruf, angka, dan _ (3-32 karakter)." },
      { status: 400 }
    );
  }
  if (!SERVER_NAME_RE.test(serverName)) {
    return NextResponse.json(
      { message: "Nama server 3-40 karakter (huruf/angka/spasi/-/_ saja)." },
      { status: 400 }
    );
  }

  const serverConfig = getServerById(serverId);
  if (!serverConfig) {
    return NextResponse.json({ message: "Server tidak ditemukan." }, { status: 400 });
  }
  if (!(await isServerAvailable(serverId))) {
    return NextResponse.json(
      { message: `Server ${serverConfig.name} sudah penuh, pilih server lain.` },
      { status: 409 }
    );
  }

  if (!isValidEgg(eggId)) {
    return NextResponse.json({ message: "Runtime/Environment tidak valid." }, { status: 400 });
  }

  const egg = getEggById(eggId)!;
  const selection: PanelSelection = {
    ram: pickInt(body?.ram) as PanelSelection["ram"],
    disk: pickInt(body?.disk) as PanelSelection["disk"],
    cpu: pickInt(body?.cpu) as PanelSelection["cpu"],
    eggId: egg.id,
    nestId: egg.nestId
  };
  if (!isValidSelection(selection)) {
    return NextResponse.json({ message: "Spesifikasi tidak valid." }, { status: 400 });
  }

  const basePrice = calculatePanelPrice(selection);
  if (basePrice <= 0) {
    return NextResponse.json({ message: "Harga tidak bisa dihitung." }, { status: 400 });
  }

  try {
    const { payload, token } = createPanelOrderToken(
      { name, email, phone },
      {
        username,
        password: generatePanelPassword(),
        selection,
        serverName,
        serverId,
        eggId: egg.id,
        eggName: egg.name
      },
      basePrice
    );
    return NextResponse.json({
      order: payload,
      token,
      paymentUrl: `/pay/${encodeURIComponent(token)}`
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat order.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
