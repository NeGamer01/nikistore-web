"use client";

import { useEffect, useState, useCallback } from "react";
import { Power, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";
import { formatDate } from "@/lib/date";

type PanelOrder = {
  _id: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  amount: number;
  status: "pending" | "paid" | "expired";
  createdAt: number;
  panel?: {
    username: string;
    serverId: string;
    serverName: string;
    ram: number;
    disk: number;
    cpu: number;
  };
};

export default function AdminPanelPage() {
  const [orders, setOrders] = useState<PanelOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/panel-orders")
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const refreshSettings = useCallback(() => {
    fetch("/api/panel-settings")
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d.enabled)))
      .catch(() => setEnabled(true));
  }, []);

  useEffect(() => { refreshSettings(); }, [refreshSettings]);

  const [error, setError] = useState("");

  async function toggle() {
    if (enabled === null) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/panel-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !enabled })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message || `Error ${res.status}`);
        return;
      }
      setEnabled(!enabled);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal update");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", margin: 0 }}>
          Panel Orders
        </h1>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.65rem 1rem", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "999px", background: "rgba(255,255,255,0.03)" }}>
          <Power size={16} color="#818cf8" />
          <span style={{ color: "#fff", fontSize: "0.9rem" }}>
            {enabled === null ? "..." : enabled ? "Aktif" : "Nonaktif"}
          </span>
          <button
            type="button"
            onClick={toggle}
            disabled={enabled === null || busy}
            style={{
              padding: "0.45rem 1rem",
              borderRadius: "999px",
              border: "none",
              cursor: busy ? "wait" : "pointer",
              fontWeight: 600,
              fontSize: "0.85rem",
              background: enabled ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
              color: enabled ? "#f87171" : "#4ade80",
              transition: "all 0.2s"
            }}
          >
            {busy ? <Loader2 className="spin" size={14} /> : enabled ? "Matikan" : "Aktifkan"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "0.5rem",
          padding: "0.75rem 1rem",
          marginBottom: "1.5rem",
          color: "#f87171",
          fontSize: "0.9rem"
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ color: "#fff", textAlign: "center", padding: "4rem" }}>Loading...</div>
      ) : orders.length === 0 ? (
        <div style={{
          background: "#1e293b",
          borderRadius: "0.75rem",
          padding: "3rem",
          textAlign: "center",
          color: "rgba(255,255,255,0.5)"
        }}>
          Belum ada panel orders
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {orders.map((order) => (
            <div
              key={order._id}
              style={{
                background: "#1e293b",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                border: "1px solid rgba(255,255,255,0.1)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.6)", fontSize: "0.85rem", marginBottom: "0.25rem" }}>
                    {order._id}
                  </div>
                  <div style={{ color: "#fff", fontWeight: 600, fontSize: "1.1rem" }}>
                    {order.customerName}
                  </div>
                </div>
                <span style={{
                  padding: "0.25rem 0.75rem",
                  borderRadius: "999px",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  background: order.status === "paid" ? "rgba(16, 185, 129, 0.2)" :
                             order.status === "pending" ? "rgba(245, 158, 11, 0.2)" :
                             "rgba(239, 68, 68, 0.2)",
                  color: order.status === "paid" ? "#10b981" :
                        order.status === "pending" ? "#f59e0b" :
                        "#ef4444"
                }}>
                  {order.status}
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Email</div>
                  <div style={{ color: "#fff", fontSize: "0.9rem" }}>{order.customerEmail}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Phone</div>
                  <div style={{ color: "#fff", fontSize: "0.9rem" }}>{order.customerPhone}</div>
                </div>
                <div>
                  <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Amount</div>
                  <div style={{ color: "#10b981", fontSize: "0.9rem", fontWeight: 600 }}>{formatRupiah(order.amount)}</div>
                </div>
              </div>

              {order.panel && (
                <div style={{
                  background: "rgba(99, 102, 241, 0.1)",
                  border: "1px solid rgba(99, 102, 241, 0.3)",
                  borderRadius: "0.5rem",
                  padding: "1rem"
                }}>
                  <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "#818cf8", marginBottom: "0.75rem" }}>
                    Panel Details
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "0.75rem" }}>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Username</div>
                      <div style={{ color: "#fff", fontSize: "0.9rem", fontFamily: "monospace" }}>{order.panel.username}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Server</div>
                      <div style={{ color: "#fff", fontSize: "0.9rem" }}>{order.panel.serverName}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.25rem" }}>Specs</div>
                      <div style={{ color: "#fff", fontSize: "0.9rem" }}>
                        {order.panel.ram}GB / {order.panel.disk}GB / {order.panel.cpu}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "0.75rem" }}>
                {formatDate(order.createdAt)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
