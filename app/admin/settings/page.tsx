"use client";

import { useEffect, useState } from "react";

type Settings = {
  paygw_url: string;
  paygw_api_key: string;
  ptero_url: string;
  ptero_api_key: string;
  ptero_node_id: string;
  panelEnabled: string;
};

type SettingsResponse = {
  settings: Settings;
  status: { paygateway: boolean; pterodactyl: boolean };
};

export default function AdminSettingsPage() {
  const [data, setData] = useState<SettingsResponse | null>(null);
  const [form, setForm] = useState<Settings | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((d: SettingsResponse) => {
        setData(d);
        setForm(d.settings);
      })
      .catch(() => setMessage("Gagal memuat settings."))
      .finally(() => {});
  }, []);

  async function save() {
    if (!form) return;
    setSaving(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const json = await res.json();
      if (res.ok) {
        setMessage("Settings tersimpan.");
      } else {
        setMessage(json.message || "Gagal menyimpan.");
      }
    } catch (e) {
      setMessage("Gagal menyimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function testPaygateway() {
    setTesting(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/settings", { method: "POST" });
      const json = await res.json();
      setMessage(json.success ? `✅ ${json.message}` : `❌ ${json.message}`);
    } catch (e) {
      setMessage("❌ Gagal tes koneksi.");
    } finally {
      setTesting(false);
    }
  }

  if (!form) {
    return <div style={{ color: "#fff", padding: "4rem", textAlign: "center" }}>Loading...</div>;
  }

  return (
    <div style={{ maxWidth: "640px" }}>
      <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", marginBottom: "0.5rem" }}>
        Settings
      </h1>
      <p style={{ color: "#94a3b8", marginBottom: "2rem" }}>
        Konfigurasi payment gateway &amp; panel Pterodactyl. Tersimpan di database, tidak perlu edit .env.
      </p>

      {message ? (
        <div
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "1.5rem",
            borderRadius: "8px",
            background: message.startsWith("✅") ? "#064e3b" : message.startsWith("❌") ? "#7f1d1d" : "#1e293b",
            color: "#e2e8f0",
            fontSize: "0.9rem"
          }}
        >
          {message}
        </div>
      ) : null}

      <Section title="PayGateway (QRIS)">
        <Field
          label="PayGateway URL"
          value={form.paygw_url}
          onChange={(v) => setForm({ ...form, paygw_url: v })}
          placeholder="https://pay.halogamingzone.com"
        />
        <Field
          label="PayGateway API Key"
          value={form.paygw_api_key}
          onChange={(v) => setForm({ ...form, paygw_api_key: v })}
          placeholder="qp_xxx"
          type="password"
        />
        <button
          onClick={testPaygateway}
          disabled={testing}
          style={btnGhost}
        >
          {testing ? "Testing..." : "Tes Koneksi PayGateway"}
        </button>
      </Section>

      <Section title="Pterodactyl Panel">
        <Field
          label="Panel URL"
          value={form.ptero_url}
          onChange={(v) => setForm({ ...form, ptero_url: v })}
          placeholder="https://panel.domainkamu.com"
        />
        <Field
          label="Application API Key (ptla_...)"
          value={form.ptero_api_key}
          onChange={(v) => setForm({ ...form, ptero_api_key: v })}
          placeholder="ptla_xxx"
          type="password"
        />
        <Field
          label="Node ID"
          value={form.ptero_node_id}
          onChange={(v) => setForm({ ...form, ptero_node_id: v })}
          placeholder="1"
        />
      </Section>

      <button onClick={save} disabled={saving} style={btnPrimary}>
        {saving ? "Menyimpan..." : "Simpan Settings"}
      </button>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#1e293b",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem"
      }}
    >
      <h2 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#fff", marginBottom: "1rem" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text"
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label
        style={{
          display: "block",
          fontSize: "0.85rem",
          color: "#94a3b8",
          marginBottom: "0.35rem"
        }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={inputStyle}
      />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.6rem 0.8rem",
  borderRadius: "8px",
  border: "1px solid #334155",
  background: "#0f172a",
  color: "#e2e8f0",
  fontSize: "0.9rem",
  outline: "none"
};

const btnPrimary: React.CSSProperties = {
  padding: "0.7rem 1.5rem",
  borderRadius: "8px",
  border: "none",
  background: "#6366f1",
  color: "#fff",
  fontSize: "0.95rem",
  fontWeight: 600,
  cursor: "pointer"
};

const btnGhost: React.CSSProperties = {
  padding: "0.55rem 1.2rem",
  borderRadius: "8px",
  border: "1px solid #334155",
  background: "transparent",
  color: "#e2e8f0",
  fontSize: "0.9rem",
  cursor: "pointer"
};
