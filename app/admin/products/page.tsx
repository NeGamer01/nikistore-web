"use client";

import { useEffect, useState } from "react";
import { formatRupiah } from "@/lib/format";
import { formatDate } from "@/lib/date";

type Product = {
  _id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  price: number;
  promoPrice?: number;
  category: string;
  image: string;
  stack: string[];
  includes: string[];
  highlights: string[];
  downloadEnvKey: string;
  active: boolean;
  createdAt: number;
  updatedAt: number;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to load products:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Yakin mau hapus produk ini?")) return;
    try {
      await fetch("/api/admin/products", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
      loadProducts();
    } catch (error) {
      alert("Gagal delete product");
    }
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setShowForm(true);
  }

  function handleCreate() {
    setEditingProduct(null);
    setShowForm(true);
  }

  function handleCloseForm() {
    setShowForm(false);
    setEditingProduct(null);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "2rem", fontWeight: 700, color: "#fff", margin: 0 }}>
          Products
        </h1>
        <button
          onClick={handleCreate}
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
          + Tambah Produk
        </button>
      </div>

      {showForm && (
        <ProductForm
          product={editingProduct}
          onClose={handleCloseForm}
          onSave={() => {
            handleCloseForm();
            loadProducts();
          }}
        />
      )}

      {loading ? (
        <div style={{ color: "#fff", textAlign: "center", padding: "4rem" }}>Loading...</div>
      ) : products.length === 0 ? (
        <div style={{
          background: "#1e293b",
          borderRadius: "0.75rem",
          padding: "3rem",
          textAlign: "center",
          color: "rgba(255,255,255,0.5)"
        }}>
          Belum ada produk
        </div>
      ) : (
        <div style={{ display: "grid", gap: "1.5rem" }}>
          {products.map((product) => (
            <div
              key={product._id}
              style={{
                background: "#1e293b",
                borderRadius: "0.75rem",
                padding: "1.5rem",
                border: "1px solid rgba(255,255,255,0.1)",
                display: "flex",
                gap: "1.5rem"
              }}
            >
              <img
                src={product.image}
                alt={product.title}
                style={{
                  width: "120px",
                  height: "120px",
                  objectFit: "cover",
                  borderRadius: "0.5rem"
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", fontWeight: 600, color: "#fff", margin: "0 0 0.5rem" }}>
                      {product.title}
                    </h3>
                    <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.9rem", margin: "0 0 0.5rem" }}>
                      {product.subtitle}
                    </p>
                    <div style={{ display: "flex", gap: "0.5rem", fontSize: "0.85rem", color: "rgba(255,255,255,0.5)" }}>
                      <span>{product.category}</span>
                      <span>•</span>
                      <span style={{ color: "#10b981", fontWeight: 600 }}>
                        {formatRupiah(product.promoPrice || product.price)}
                      </span>
                      {product.promoPrice && (
                        <>
                          <span>•</span>
                          <span style={{ textDecoration: "line-through" }}>
                            {formatRupiah(product.price)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleEdit(product)}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(99, 102, 241, 0.3)",
                        background: "rgba(99, 102, 241, 0.1)",
                        color: "#818cf8",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product._id)}
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "0.5rem",
                        border: "1px solid rgba(239, 68, 68, 0.3)",
                        background: "rgba(239, 68, 68, 0.1)",
                        color: "#f87171",
                        fontSize: "0.85rem",
                        fontWeight: 500,
                        cursor: "pointer"
                      }}
                    >
                      Hapus
                    </button>
                  </div>
                </div>
                <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.4)", marginTop: "0.5rem" }}>
                  Updated {formatDate(product.updatedAt)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductForm({
  product,
  onClose,
  onSave
}: {
  product: Product | null;
  onClose: () => void;
  onSave: () => void;
}) {
  const [formData, setFormData] = useState({
    slug: product?.slug || "",
    title: product?.title || "",
    subtitle: product?.subtitle || "",
    description: product?.description || "",
    price: product?.price?.toString() || "",
    promoPrice: product?.promoPrice?.toString() || "",
    category: product?.category || "",
    image: product?.image || "",
    stack: product?.stack?.join(", ") || "",
    includes: product?.includes?.join(", ") || "",
    highlights: product?.highlights?.join(", ") || "",
    downloadEnvKey: product?.downloadEnvKey || ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        ...formData,
        id: product?._id,
        price: Number(formData.price) || 0,
        promoPrice: formData.promoPrice ? Number(formData.promoPrice) : undefined,
        stack: formData.stack.split(",").map((s) => s.trim()).filter(Boolean),
        includes: formData.includes.split(",").map((s) => s.trim()).filter(Boolean),
        highlights: formData.highlights.split(",").map((s) => s.trim()).filter(Boolean)
      };

      const method = product ? "PUT" : "POST";
      const res = await fetch("/api/admin/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Gagal save product");
        return;
      }

      onSave();
    } catch (err) {
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.7)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 50,
      padding: "1rem"
    }}>
      <div style={{
        background: "#1e293b",
        borderRadius: "0.75rem",
        padding: "2rem",
        maxWidth: "600px",
        width: "100%",
        maxHeight: "90vh",
        overflow: "auto",
        border: "1px solid rgba(255,255,255,0.1)"
      }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, color: "#fff", marginBottom: "1.5rem" }}>
          {product ? "Edit Product" : "Tambah Product"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gap: "1rem" }}>
            <FormField label="Slug" value={formData.slug} onChange={(v) => setFormData({ ...formData, slug: v })} required />
            <FormField label="Title" value={formData.title} onChange={(v) => setFormData({ ...formData, title: v })} required />
            <FormField label="Subtitle" value={formData.subtitle} onChange={(v) => setFormData({ ...formData, subtitle: v })} />
            <div>
              <label style={{ display: "block", marginBottom: "0.5rem", color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  borderRadius: "0.5rem",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#0f172a",
                  color: "#fff",
                  fontSize: "0.9rem",
                  fontFamily: "inherit"
                }}
              />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <FormField label="Price" value={formData.price} onChange={(v) => setFormData({ ...formData, price: v })} type="number" required />
              <FormField label="Promo Price" value={formData.promoPrice} onChange={(v) => setFormData({ ...formData, promoPrice: v })} type="number" />
            </div>
            <FormField label="Category" value={formData.category} onChange={(v) => setFormData({ ...formData, category: v })} />
            <FormField label="Image URL" value={formData.image} onChange={(v) => setFormData({ ...formData, image: v })} />
            <FormField label="Stack (comma separated)" value={formData.stack} onChange={(v) => setFormData({ ...formData, stack: v })} />
            <FormField label="Includes (comma separated)" value={formData.includes} onChange={(v) => setFormData({ ...formData, includes: v })} />
            <FormField label="Highlights (comma separated)" value={formData.highlights} onChange={(v) => setFormData({ ...formData, highlights: v })} />
            <FormField label="Download Env Key" value={formData.downloadEnvKey} onChange={(v) => setFormData({ ...formData, downloadEnvKey: v })} />
          </div>

          {error && (
            <div style={{
              padding: "0.75rem",
              borderRadius: "0.5rem",
              background: "rgba(239, 68, 68, 0.1)",
              color: "#f87171",
              fontSize: "0.9rem",
              marginTop: "1rem"
            }}>
              {error}
            </div>
          )}

          <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
            <button
              type="submit"
              disabled={loading}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "none",
                background: "#6366f1",
                color: "#fff",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1
              }}
            >
              {loading ? "Saving..." : product ? "Update" : "Create"}
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                flex: 1,
                padding: "0.75rem",
                borderRadius: "0.5rem",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent",
                color: "#fff",
                fontSize: "0.9rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FormField({
  label,
  value,
  onChange,
  type = "text",
  required = false
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label style={{ display: "block", marginBottom: "0.5rem", color: "rgba(255,255,255,0.8)", fontSize: "0.9rem" }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        style={{
          width: "100%",
          padding: "0.75rem",
          borderRadius: "0.5rem",
          border: "1px solid rgba(255,255,255,0.1)",
          background: "#0f172a",
          color: "#fff",
          fontSize: "0.9rem"
        }}
      />
    </div>
  );
}
