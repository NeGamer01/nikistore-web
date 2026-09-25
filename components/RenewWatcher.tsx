"use client";

import { ArrowLeft, CheckCircle2, Clock3, Loader2, QrCode, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";

type RenewStatus = {
  status: "pending" | "paid" | "expired" | "error";
  message?: string;
  newExpiresAt?: number;
  newExpireDate?: string;
};

export function RenewWatcher({ token, amount, uniqueCode }: { token: string; amount: number; uniqueCode: number }) {
  const [state, setState] = useState<RenewStatus>({ status: "pending" });
  const [checking, setChecking] = useState(false);

  const check = useCallback(async () => {
    setChecking(true);
    try {
      const res = await fetch(`/api/renew-pay/${encodeURIComponent(token)}`, { cache: "no-store" });
      const data = await res.json();
      setState(data);
    } catch {
      setState({ status: "error", message: "Gagal cek pembayaran." });
    } finally {
      setChecking(false);
    }
  }, [token]);

  useEffect(() => {
    const stop = state.status === "paid" || state.status === "expired" || state.status === "error";
    if (stop) return;
    check();
    const timer = window.setInterval(check, 6000);
    return () => window.clearInterval(timer);
  }, [check, state.status]);

  if (state.status === "paid") {
    return (
      <div className="status-box paid">
        <CheckCircle2 size={22} />
        <div>
          <strong>Perpanjangan berhasil</strong>
          <p>Masa aktif baru sampai {state.newExpireDate}.</p>
        </div>
        <Link className="icon-button primary" href="/my-servers">
          Lihat Server Saya
        </Link>
      </div>
    );
  }

  if (state.status === "expired") {
    return (
      <div className="status-box expired">
        <Clock3 size={22} />
        <div>
          <strong>Invoice kedaluwarsa</strong>
          <p>Silakan buat perpanjangan baru.</p>
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="status-box expired">
        <Clock3 size={22} />
        <div>
          <strong>Terjadi kesalahan</strong>
          <p>{state.message || "Silakan coba lagi."}</p>
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
        <p style={{ marginTop: "0.5rem", fontSize: "0.85rem", opacity: 0.7 }}>
          Bayar tepat <strong>{formatRupiah(amount)}</strong> (termasuk kode unik {formatRupiah(uniqueCode)})
        </p>
      </div>
      <button className="icon-button ghost" type="button" onClick={check} disabled={checking} aria-label="Cek ulang">
        <RefreshCw size={18} />
      </button>
    </div>
  );
}
