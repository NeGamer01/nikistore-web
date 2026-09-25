"use client";

import { Server, Power, Loader2 } from "lucide-react";
import { PanelOrderForm } from "@/components/PanelOrderForm";
import { Topbar } from "@/components/Topbar";
import { useCallback, useEffect, useState } from "react";

export default function PanelOrderPage() {
  const [enabled, setEnabled] = useState<boolean | null>(null);

  const refresh = useCallback(() => {
    fetch("/api/panel-settings")
      .then((r) => r.json())
      .then((d) => setEnabled(Boolean(d.enabled)))
      .catch(() => setEnabled(true));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <main>
      <Topbar />

      <section className="panel-hero">
        <span className="eyebrow">Pterodactyl</span>
        <h1>Order Panel Custom</h1>
        <p>Pilih spesifikasi server sesuai kebutuhan. Setelah QRIS dibayar, server otomatis dibuat dan kredensial dikirim via WhatsApp.</p>
      </section>

      {enabled === null ? (
        <section className="checkout-layout">
          <div style={{ textAlign: "center", padding: "3rem 1rem", opacity: 0.6 }}>
            <Loader2 className="spin" size={24} style={{ margin: "0 auto" }} />
          </div>
        </section>
      ) : enabled ? (
        <section className="checkout-layout">
          <div className="checkout-summary">
            <div className="panel-icon">
              <Server size={40} />
            </div>
            <span className="eyebrow">Auto Provisioning</span>
            <h2>Cara order</h2>
            <ol className="ordered-list">
              <li>Pilih nama server dan username panel.</li>
              <li>Atur RAM, disk, dan CPU.</li>
              <li>Bayar via QRIS.</li>
              <li>Server otomatis dibuat dan kredensial dikirim ke WhatsApp.</li>
            </ol>
            <p className="muted-note">Username hanya huruf, angka, dan _ (3-32 karakter). Simpan kredensial yang dikirim, ganti password setelah login.</p>
          </div>
          <PanelOrderForm />
        </section>
      ) : (
        <section className="checkout-layout">
          <div style={{ textAlign: "center", padding: "4rem 1rem" }}>
            <Power size={48} style={{ opacity: 0.4, margin: "0 auto 1rem" }} />
            <h2 style={{ marginBottom: "0.5rem" }}>Order Panel Ditutup Sementara</h2>
            <p style={{ opacity: 0.7 }}>Silakan hubungi admin untuk informasi lebih lanjut.</p>
          </div>
        </section>
      )}
    </main>
  );
}
