"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Calendar, Server, CreditCard, AlertCircle, Loader2 } from "lucide-react";
import { formatRupiah } from "@/lib/format";

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

export default function RenewPage() {
  const params = useParams();
  const orderId = params.orderId as string;

  const [server, setServer] = useState<PanelServer | null>(null);
  const [renewPrice, setRenewPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/renew/${orderId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Server tidak ditemukan");
        return res.json();
      })
      .then((data) => {
        setServer(data.server);
        setRenewPrice(data.renewPrice);
        setCustomerEmail(data.server.email);
        setCustomerPhone(data.server.phone);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [orderId]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/renew/${orderId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, customerEmail, customerPhone })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Gagal membuat order perpanjangan");
      }

      const data = await res.json();
      window.location.href = data.paymentUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center">
        <Loader2 className="animate-spin" size={48} />
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex items-center justify-center px-4">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm text-center max-w-md">
          <AlertCircle className="mx-auto mb-4 text-red-400" size={48} />
          <p className="text-xl font-semibold mb-2">Server Tidak Ditemukan</p>
          <p className="text-slate-400">{error || "Server yang Anda cari tidak ditemukan."}</p>
        </div>
      </div>
    );
  }

  const daysLeft = getDaysLeft(server.expiresAt);
  const uniqueCode = Math.floor(Math.random() * 1000);
  const totalAmount = renewPrice + uniqueCode;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Perpanjang Server</h1>
          <p className="text-slate-400">
            Perpanjang masa aktif server selama 30 hari
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm mb-6">
          <div className="flex items-start gap-3 mb-4">
            <Server className="text-blue-400 mt-1" size={24} />
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-1">{server.serverName}</h3>
              <p className="text-slate-400 text-sm">
                {server.eggName} • {server.username}
              </p>
            </div>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Masa aktif saat ini</span>
              <div className="flex items-center gap-2">
                <Calendar size={16} className="text-slate-400" />
                <span className="font-medium">{formatExpireDate(server.expiresAt)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Sisa waktu</span>
              <span className={`font-semibold ${daysLeft <= 0 ? "text-red-400" : daysLeft <= 3 ? "text-orange-400" : "text-green-400"}`}>
                {daysLeft <= 0 ? "Sudah kadaluarsa" : `${daysLeft} hari lagi`}
              </span>
            </div>
          </div>

          <div className="border-t border-slate-700 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Harga perpanjangan (30 hari)</span>
              <span className="font-semibold text-lg">{formatRupiah(renewPrice)}</span>
            </div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-slate-400">Kode unik</span>
              <span className="font-semibold">{formatRupiah(uniqueCode)}</span>
            </div>
            <div className="border-t border-slate-700 pt-2 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-white font-semibold text-lg">Total</span>
                <span className="text-white font-bold text-2xl">{formatRupiah(totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold mb-4">Data Pembeli</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-2">Nama Lengkap</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                placeholder="Masukkan nama lengkap"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Email</label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                placeholder="email@example.com"
              />
            </div>

            <div>
              <label className="block text-slate-400 text-sm mb-2">Nomor WhatsApp</label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
                placeholder="08xxxxxxxxxx"
              />
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-3">
              <AlertCircle className="text-red-400 mt-0.5" size={20} />
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-6 px-6 py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:cursor-not-allowed rounded-lg font-semibold text-lg transition-colors flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Memproses...
              </>
            ) : (
              <>
                <CreditCard size={20} />
                Lanjut ke Pembayaran
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
