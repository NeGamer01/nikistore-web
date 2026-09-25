"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";

type Stats = {
  totalOrders: number;
  paidOrders: number;
  pendingOrders: number;
  expiredOrders: number;
  totalRevenue: number;
  revenueThisMonth: number;
  topProducts: Array<{
    productTitle: string;
    count: number;
    revenue: number;
  }>;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((res) => res.json())
      .then((data) => setStats(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div style={{ color: "#fff", textAlign: "center", padding: "4rem" }}>Loading...</div>;
  }

  if (!stats) {
    return <div style={{ color: "#f87171", textAlign: "center", padding: "4rem" }}>Gagal memuat statistik</div>;
  }

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "2rem" }}>
        Dashboard
      </h1>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2rem"
      }}>
        <StatCard title="Total Orders" value={stats.totalOrders} color="#6366f1" />
        <StatCard title="Paid Orders" value={stats.paidOrders} color="#10b981" />
        <StatCard title="Pending Orders" value={stats.pendingOrders} color="#f59e0b" />
        <StatCard title="Total Revenue" value={formatRupiah(stats.totalRevenue)} color="#8b5cf6" />
        <StatCard title="Revenue This Month" value={formatRupiah(stats.revenueThisMonth)} color="#ec4899" />
      </div>

      <div style={{
        background: "#1e293b",
        borderRadius: "0.75rem",
        padding: "1.5rem",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", marginBottom: "1rem" }}>
          Top Products
        </h2>
        {stats.topProducts.length === 0 ? (
          <p style={{ color: "rgba(255,255,255,0.5)" }}>Belum ada data produk</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {stats.topProducts.map((product, index) => (
              <div
                key={product.productTitle}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "1rem",
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: "0.5rem"
                }}
              >
                <div>
                  <div style={{ color: "#fff", fontWeight: 500 }}>
                    {index + 1}. {product.productTitle}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.85rem", marginTop: "0.25rem" }}>
                    {product.count} orders
                  </div>
                </div>
                <div style={{ color: "#10b981", fontWeight: 600, fontSize: "1.1rem" }}>
                  {formatRupiah(product.revenue)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, color }: { title: string; value: string | number; color: string }) {
  return (
    <div style={{
      background: "#1e293b",
      borderRadius: "0.75rem",
      padding: "1.5rem",
      border: "1px solid rgba(255,255,255,0.1)"
    }}>
      <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.5)", marginBottom: "0.5rem" }}>
        {title}
      </div>
      <div style={{ fontSize: "2rem", fontWeight: 700, color }}>
        {value}
      </div>
    </div>
  );
}
