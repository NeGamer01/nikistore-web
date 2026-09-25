"use client";

import { useState } from "react";
import { Search, Server, Calendar, RefreshCw, AlertCircle, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Topbar } from "@/components/Topbar";

type PanelServer = {
  _id: string;
  orderId: string;
  serverName: string;
  username: string;
  phone: string;
  email: string;
  pterodactylServerId?: string | number;
  panelUrl: string;
  ram: number;
  disk: number;
  cpu: number;
  eggId: number;
  eggName: string;
  createdAt: number;
  expiresAt: number;
  renewedCount: number;
};

export default function MyServersPage() {
  const [query, setQuery] = useState("");
  const [servers, setServers] = useState<PanelServer[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = async (searchQuery?: string) => {
    const q = searchQuery ?? query;
    if (!q.trim()) {
      setServers([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/my-servers?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error("Search failed:", error);
      setServers([]);
    } finally {
      setLoading(false);
    }
  };

  const formatExpireDate = (expiresAt: number) => {
    const date = new Date(expiresAt);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const getDaysLeft = (expiresAt: number) => {
    const days = Math.ceil((expiresAt - Date.now()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getExpireBadgeClass = (expiresAt: number) => {
    const days = getDaysLeft(expiresAt);
    if (days <= 0) return "expire-badge expire-badge-expired";
    if (days <= 3) return "expire-badge expire-badge-warning";
    if (days <= 7) return "expire-badge expire-badge-soon";
    return "expire-badge expire-badge-ok";
  };

  const formatSpecs = (ram: number, disk: number, cpu: number) => {
    const ramStr = ram === 0 ? "Unlimited" : `${(ram / 1024).toFixed(0)} GB`;
    const diskStr = disk === 0 ? "Unlimited" : `${(disk / 1024).toFixed(0)} GB`;
    const cpuStr = cpu === 0 ? "Unlimited" : `${cpu}%`;
    return `${ramStr} / ${diskStr} / ${cpuStr}`;
  };

  return (
    <main>
      <Topbar />

      <section className="panel-hero">
        <span className="eyebrow">Server Management</span>
        <h1>Server Saya</h1>
        <p>Cari server panel kamu dengan nomor WhatsApp, email, atau nama server</p>
      </section>

      <section className="checkout-layout my-servers-layout">
        <div className="checkout-summary my-servers-search">
          <div className="my-servers-search-box">
            <Search size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && search()}
              placeholder="Masukkan nomor WhatsApp, email, atau nama server..."
              className="my-servers-input"
            />
            <button
              onClick={() => search()}
              disabled={loading || !query.trim()}
              className="icon-button primary"
            >
              {loading ? <RefreshCw className="spin" size={18} /> : <Search size={18} />}
              Cari
            </button>
          </div>
        </div>

        {searched && servers.length === 0 && !loading && (
          <div className="my-servers-empty">
            <AlertCircle size={48} />
            <h2>Tidak ada server yang ditemukan</h2>
            <p>Pastikan nomor WhatsApp, email, atau nama server sudah benar</p>
          </div>
        )}

        {servers.length > 0 && (
          <div className="my-servers-list">
            <h2>Ditemukan {servers.length} server</h2>
            {servers.map((server) => {
              const daysLeft = getDaysLeft(server.expiresAt);
              const isExpired = daysLeft <= 0;

              return (
                <div key={server._id} className="my-server-card">
                  <div className="my-server-card-header">
                    <div className="my-server-card-title">
                      <Server size={24} />
                      <div>
                        <h3>{server.serverName}</h3>
                        <p>{server.eggName} • {server.username}</p>
                      </div>
                    </div>
                  </div>

                  <div className="my-server-card-specs">
                    <div className="my-server-spec">
                      <span className="my-server-spec-label">Spesifikasi</span>
                      <span className="my-server-spec-value">{formatSpecs(server.ram, server.disk, server.cpu)}</span>
                    </div>
                    <div className="my-server-spec">
                      <span className="my-server-spec-label">Diperpanjang</span>
                      <span className="my-server-spec-value">{server.renewedCount}x</span>
                    </div>
                    <div className="my-server-spec">
                      <span className="my-server-spec-label">Kadaluarsa</span>
                      <div className="my-server-spec-expire">
                        <Calendar size={16} />
                        <span className={getExpireBadgeClass(server.expiresAt)}>
                          {formatExpireDate(server.expiresAt)}
                          {daysLeft > 0 && ` (${daysLeft} hari)`}
                          {daysLeft <= 0 && " (Expired)"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="my-server-card-meta">
                    <span>📧 {server.email}</span>
                    <span>•</span>
                    <span>📱 {server.phone}</span>
                  </div>

                  <div className="my-server-card-actions">
                    <Link
                      href={server.panelUrl}
                      target="_blank"
                      className="icon-button ghost"
                    >
                      <ExternalLink size={18} />
                      Buka Panel
                    </Link>
                    <Link
                      href={`/renew/${server.orderId}`}
                      className="icon-button primary"
                    >
                      {isExpired ? "Aktifkan Kembali" : "Perpanjang"}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
