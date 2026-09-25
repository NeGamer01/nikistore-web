export const dynamic = "force-dynamic";

import { BarChart3, Package, Power, Settings, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/LogoutButton";
import MobileMenu from "@/components/MobileMenu";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "#0f172a" }}>
      {/* Mobile menu */}
      <MobileMenu />

      {/* Sidebar */}
      <aside
        style={{
          width: "250px",
          background: "#1e293b",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          zIndex: 40,
          overflowY: "auto"
        }}
        className="admin-sidebar"
      >
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0, color: "#fff" }}>
            Admin Panel
          </h2>
          <p style={{ fontSize: "0.85rem", opacity: 0.5, margin: "0.25rem 0 0" }}>
            NikiStore
          </p>
        </div>

        <nav style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flex: 1 }}>
          <SidebarLink href="/admin" icon={<BarChart3 size={18} />} label="Dashboard" />
          <SidebarLink href="/admin/orders" icon={<ShoppingBag size={18} />} label="Orders" />
          <SidebarLink href="/admin/products" icon={<Package size={18} />} label="Products" />
          <SidebarLink href="/admin/panel" icon={<Power size={18} />} label="Panel" />
          <SidebarLink href="/admin/settings" icon={<Settings size={18} />} label="Settings" />
        </nav>

        <div style={{ marginTop: "1rem" }}>
          <LogoutButton />
        </div>
      </aside>

      {/* Main content */}
      <main className="admin-main" style={{ flex: 1, padding: "2rem", overflow: "auto", marginLeft: "250px" }}>
        {children}
      </main>

      <style>{`
        @media (max-width: 768px) {
          .admin-sidebar {
            position: fixed !important;
            transition: transform 0.3s ease;
          }
          .admin-main {
            margin-left: 0 !important;
            padding: 1rem !important;
            padding-top: 4rem !important;
          }
        }
        @media (min-width: 769px) {
          .admin-sidebar {
            transform: translateX(0) !important;
          }
        }
      `}</style>
    </div>
  );
}

function SidebarLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.75rem",
        padding: "0.75rem 1rem",
        borderRadius: "0.5rem",
        color: "rgba(255,255,255,0.7)",
        textDecoration: "none",
        fontSize: "0.95rem",
        fontWeight: 500,
        transition: "all 0.2s"
      }}
    >
      {icon}
      {label}
    </Link>
  );
}
