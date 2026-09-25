"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";
import { formatDate } from "@/lib/date";

type Order = {
  _id: string;
  kind: "source" | "panel";
  productId: string;
  productSlug: string;
  productTitle: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  basePrice: number;
  uniqueCode: number;
  amount: number;
  status: "pending" | "paid" | "expired";
  createdAt: number;
  paymentExpiresAt: number;
  downloadExpiresAt: number;
  paidAt?: number;
  panel?: {
    username: string;
    serverId: string;
    serverName: string;
    ram: number;
    disk: number;
    cpu: number;
  };
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [filterKind, setFilterKind] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadOrders();
  }, [filterStatus, filterKind]);

  function loadOrders() {
    setLoading(true);
    const params = new URLSearchParams();
    if (filterStatus) params.set("status", filterStatus);
    if (filterKind) params.set("kind", filterKind);
    if (search) params.set("search", search);

    fetch(`/api/admin/orders?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => setOrders(data.orders || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadOrders();
  }

  return (
    <div>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "2rem" }}>
        Orders
      </h1>

      <div style={{
        display: "flex",
        gap: "1rem",
        marginBottom: "1.5rem",
        flexWrap: "wrap"
      }}>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#1e293b",
            color: "#fff",
            fontSize: "0.9rem"
          }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="expired">Expired</option>
        </select>

        <select
          value={filterKind}
          onChange={(e) => setFilterKind(e.target.value)}
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "0.5rem",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#1e293b",
            color: "#fff",
            fontSize: "0.9rem"
          }}
        >
          <option value="">All Types</option>
          <option value="source">Source Code</option>
          <option value="panel">Panel</option>
        </select>

        <form onSubmit={handleSearch} style={{ flex: 1, display: "flex", gap: "0.5rem" }}>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID, customer, product..."
            style={{
              flex: 1,
              padding: "0.75rem 1rem",
              borderRadius: "0.5rem",
              border: "1px solid rgba(255,255,255,0.1)",
              background: "#1e293b",
              color: "#fff",
              fontSize: "0.9rem"
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "0.5rem",
              border: "none",
              background: "#6366f1",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Search
          </button>
        </form>
      </div>

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
          Tidak ada orders ditemukan
        </div>
      ) : (
        <div style={{
          background: "#1e293b",
          borderRadius: "0.75rem",
          border: "1px solid rgba(255,255,255,0.1)",
          overflow: "hidden"
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.05)" }}>
                <th style={{ padding: "1rem", textAlign: "left", color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>
                  Order ID
                </th>
                <th style={{ padding: "1rem", textAlign: "left", color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>
                  Customer
                </th>
                <th style={{ padding: "1rem", textAlign: "left", color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>
                  Product
                </th>
                <th style={{ padding: "1rem", textAlign: "right", color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>
                  Amount
                </th>
                <th style={{ padding: "1rem", textAlign: "center", color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>
                  Status
                </th>
                <th style={{ padding: "1rem", textAlign: "left", color: "#fff", fontSize: "0.9rem", fontWeight: 600 }}>
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order._id} style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}>
                  <td style={{ padding: "1rem", color: "#fff", fontSize: "0.9rem" }}>
                    <div style={{ fontFamily: "monospace" }}>{order._id}</div>
                    <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>
                      {order.kind === "panel" ? "Panel" : "Source Code"}
                    </div>
                  </td>
                  <td style={{ padding: "1rem", color: "#fff", fontSize: "0.9rem" }}>
                    <div>{order.customerName}</div>
                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>
                      {order.customerEmail}
                    </div>
                  </td>
                  <td style={{ padding: "1rem", color: "#fff", fontSize: "0.9rem" }}>
                    {order.productTitle}
                    {order.panel && (
                      <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", marginTop: "0.25rem" }}>
                        {order.panel.serverName}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "right", color: "#10b981", fontSize: "0.9rem", fontWeight: 600 }}>
                    {formatRupiah(order.amount)}
                  </td>
                  <td style={{ padding: "1rem", textAlign: "center" }}>
                    <span style={{
                      display: "inline-block",
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
                  </td>
                  <td style={{ padding: "1rem", color: "rgba(255,255,255,0.7)", fontSize: "0.85rem" }}>
                    {formatDate(order.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
