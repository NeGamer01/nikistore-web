"use client";

import { CreditCard, Loader2, Server } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { formatRupiah } from "@/lib/format";
import {
  CPU_OPTIONS,
  DISK_OPTIONS,
  RAM_OPTIONS,
  calculatePanelPrice,
  type CpuValue,
  type DiskValue,
  type RamValue
} from "@/lib/panelPricing";
import { eggs, type EggConfig } from "@/lib/eggs";

type ServerInfo = {
  id: string;
  name: string;
  location: string;
  used: number;
  max: number;
  remaining: number;
  full: boolean;
};

export function PanelOrderForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [servers, setServers] = useState<ServerInfo[] | null>(null);
  const [serversError, setServersError] = useState("");
  const [serverId, setServerId] = useState("");
  const [ram, setRam] = useState<RamValue>(1024);
  const [disk, setDisk] = useState<DiskValue>(1024);
  const [cpu, setCpu] = useState<CpuValue>(60);
  const [eggId, setEggId] = useState<number>(eggs[0]?.id || 0);

  const selectedEgg = eggs.find((e) => e.id === eggId);
  const price = useMemo(() => calculatePanelPrice({ ram, disk, cpu, eggId, nestId: selectedEgg?.nestId || 0 }), [ram, disk, cpu, eggId, selectedEgg]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/servers", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data?.servers)) {
          const list = data.servers as ServerInfo[];
          setServers(list);
          const firstAvailable = list.find((s) => !s.full);
          if (firstAvailable) setServerId(firstAvailable.id);
        } else {
          setServersError(data?.message || "Gagal load server.");
        }
      })
      .catch(() => setServersError("Gagal load server."));
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedServer = servers?.find((s) => s.id === serverId);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!serverId) {
      setError("Pilih server dulu.");
      return;
    }
    if (selectedServer?.full) {
      setError("Server yang dipilih sudah penuh.");
      return;
    }

    setLoading(true);
    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/panel-orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        username: form.get("username"),
        serverName: form.get("serverName"),
        serverId,
        ram,
        disk,
        cpu,
        eggId
      })
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data?.message || "Order panel gagal.");
      return;
    }
    router.push(data.paymentUrl);
  }

  return (
    <form className="checkout-form" onSubmit={onSubmit}>
      <div className="field">
        <label>Pilih Server</label>
        {serversError ? (
          <p className="form-error">{serversError}</p>
        ) : !servers ? (
          <p className="muted-note">Memuat daftar server...</p>
        ) : servers.length === 0 ? (
          <p className="muted-note">Belum ada server tersedia.</p>
        ) : (
          <div className="server-list">
            {servers.map((s) => {
              const active = s.id === serverId;
              const className = `server-card${active ? " active" : ""}${s.full ? " full" : ""}`;
              return (
                <button
                  key={s.id}
                  type="button"
                  className={className}
                  onClick={() => !s.full && setServerId(s.id)}
                  disabled={s.full}
                >
                  <div className="server-card-head">
                    <Server size={16} />
                    <strong>{s.name}</strong>
                  </div>
                  <div className="server-card-meta">
                    <span>{s.location}</span>
                    <span className={s.full ? "danger" : ""}>
                      {s.full ? "Penuh" : `${s.remaining}/${s.max} slot`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="field">
        <label htmlFor="serverName">Nama Server</label>
        <input
          id="serverName"
          name="serverName"
          required
          minLength={3}
          maxLength={40}
          pattern="[a-zA-Z0-9 _\-]+"
          placeholder="contoh: bot-saya"
        />
      </div>
      <div className="field">
        <label htmlFor="egg">Runtime / Environment</label>
        <select
          id="egg"
          value={eggId}
          onChange={(e) => setEggId(Number(e.target.value))}
        >
          {eggs.map((egg) => (
            <option key={egg.id} value={egg.id}>
              {egg.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="username">Username Panel</label>
        <input
          id="username"
          name="username"
          required
          minLength={3}
          maxLength={32}
          pattern="[a-zA-Z0-9_]+"
          placeholder="username_kamu"
        />
      </div>
      <div className="field">
        <label htmlFor="name">Nama</label>
        <input id="name" name="name" required minLength={2} placeholder="Nama pembeli" />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" required type="email" placeholder="email@domain.com" />
      </div>
      <div className="field">
        <label htmlFor="phone">Nomor WhatsApp</label>
        <input id="phone" name="phone" required inputMode="tel" placeholder="08xxxxxxxxxx" />
      </div>

      <div className="spec-row">
        <div className="field">
          <label htmlFor="ram">RAM</label>
          <select id="ram" value={ram} onChange={(e) => setRam(Number(e.target.value) as RamValue)}>
            {RAM_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="disk">Disk</label>
          <select id="disk" value={disk} onChange={(e) => setDisk(Number(e.target.value) as DiskValue)}>
            {DISK_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="cpu">CPU</label>
          <select id="cpu" value={cpu} onChange={(e) => setCpu(Number(e.target.value) as CpuValue)}>
            {CPU_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="checkout-total">
        <span>Total order panel</span>
        <strong className="total-price">
          <span>{formatRupiah(price)}</span>
        </strong>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="icon-button primary wide" type="submit" disabled={loading}>
        {loading ? <Loader2 className="spin" size={18} /> : <CreditCard size={18} />}
        Lanjut QRIS
      </button>
    </form>
  );
}
