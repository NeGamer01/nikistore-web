"use client";

import { CheckCircle2, Clock3, Download, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type PanelInfo = {
  panelUrl: string;
  username: string;
  password?: string;
  email?: string;
  serverId?: string | number;
};

type Status = {
  status: "pending" | "paid" | "paid_pending_panel" | "paid_panel_failed" | "expired" | "error";
  kind?: "source" | "panel";
  message?: string;
  downloadUrl?: string;
  panel?: PanelInfo;
};

export function PaymentWatcher({ token }: { token: string }) {
  const [state, setState] = useState<Status>({ status: "pending" });
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = (await res.json()) as Status;
      setState(data);
    } catch {
      setState({ status: "error", message: "Gagal cek pembayaran." });
    } finally {
      setChecking(false);
    }
  }, [token]);

  useEffect(() => {
    const stop =
      state.status === "paid" ||
      state.status === "expired" ||
      state.status === "paid_panel_failed" ||
      state.message === "Payment config belum aktif.";
    if (stop) return;
    check();
    const timer = window.setInterval(check, 6000);
    return () => window.clearInterval(timer);
  }, [check, state.message, state.status]);

  if (state.status === "paid" && state.kind === "panel" && state.panel) {
    return (
      <div className="status-box paid">
        <CheckCircle2 size={22} />
        <div>
          <strong>Server panel sudah dibuat</strong>
          <p>Simpan kredensial ini, juga dikirim ke WhatsApp.</p>
          <ul className="panel-credentials">
            <li>
              <span>Panel</span>
              <a href={state.panel.panelUrl} target="_blank" rel="noreferrer">
                {state.panel.panelUrl}
              </a>
            </li>
            <li>
              <span>Username</span>
              <code>{state.panel.username}</code>
            </li>
            {state.panel.password ? (
              <li>
                <span>Password</span>
                <code>{state.panel.password}</code>
              </li>
            ) : null}
            {state.panel.email ? (
              <li>
                <span>Email</span>
                <code>{state.panel.email}</code>
              </li>
            ) : null}
          </ul>
        </div>
        <a className="icon-button primary" href={state.panel.panelUrl} target="_blank" rel="noreferrer">
          <ExternalLink size={18} />
          Buka panel
        </a>
      </div>
    );
  }

  if (state.status === "paid") {
    return (
      <div className="status-box paid">
        <CheckCircle2 size={22} />
        <div>
          <strong>Pembayaran diterima</strong>
          <p>Source code siap diunduh.</p>
        </div>
        <a className="icon-button primary" href={state.downloadUrl}>
          <Download size={18} />
          Download
        </a>
      </div>
    );
  }

  if (state.status === "paid_pending_panel") {
    return (
      <div className="status-box">
        <Loader2 className="spin" size={22} />
        <div>
          <strong>Pembayaran diterima</strong>
          <p>{state.message || "Server panel sedang dibuat."}</p>
        </div>
      </div>
    );
  }

  if (state.status === "paid_panel_failed") {
    return (
      <div className="status-box expired">
        <Clock3 size={22} />
        <div>
          <strong>Pembayaran berhasil, server gagal dibuat</strong>
          <p>{state.message || "Hubungi owner untuk provisioning manual."}</p>
        </div>
      </div>
    );
  }

  if (state.status === "expired") {
    return (
      <div className="status-box expired">
        <Clock3 size={22} />
        <div>
          <strong>Invoice kedaluwarsa</strong>
          <p>Buat checkout baru untuk nominal unik baru.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="status-box">
      {checking ? <Loader2 className="spin" size={22} /> : <Clock3 size={22} />}
      <div>
        <strong>Menunggu pembayaran</strong>
        <p>{state.message || "Status otomatis dicek tiap beberapa detik."}</p>
      </div>
      <button className="icon-button ghost" type="button" onClick={check} disabled={checking} aria-label="Cek ulang">
        <RefreshCw size={18} />
      </button>
    </div>
  );
}
