"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "logout" })
    });
    router.push("/admin/login");
  }

  return (
    <button
      onClick={handleLogout}
      style={{
        width: "100%",
        padding: "0.75rem",
        borderRadius: "0.5rem",
        border: "1px solid rgba(239, 68, 68, 0.3)",
        background: "rgba(239, 68, 68, 0.1)",
        color: "#f87171",
        fontSize: "0.9rem",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s"
      }}
    >
      Logout
    </button>
  );
}
