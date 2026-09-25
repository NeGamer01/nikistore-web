"use client";

import { CreditCard, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { formatRupiah } from "@/lib/format";
import { getProductPrice, hasPromo, type Product } from "@/lib/products";

export function CheckoutForm({ product }: { product: Product }) {
  const router = useRouter();
  const salePrice = getProductPrice(product);
  const promo = hasPromo(product);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(event.currentTarget);
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        productId: product.id,
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone")
      })
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data?.message || "Checkout gagal.");
      return;
    }
    router.push(data.paymentUrl);
  }

  return (
    <form className="checkout-form" onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="name">Nama</label>
        <input id="name" name="name" required minLength={2} placeholder="Nama pembeli" />
      </div>
      <div className="field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" required type="email" placeholder="email@domain.com" />
      </div>
      <div className="field">
        <label htmlFor="phone">Nomor WhatsApp</label>
        <input id="phone" name="phone" required inputMode="tel" placeholder="08xxxxxxxxxx" />
      </div>
      <div className="checkout-total">
        <span>Total produk</span>
        <strong className="total-price">
          {promo ? <span className="price-old">{formatRupiah(product.price)}</span> : null}
          <span>{formatRupiah(salePrice)}</span>
        </strong>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="icon-button primary wide" type="submit" disabled={loading}>
        {loading ? <Loader2 className="spin" size={18} /> : <CreditCard size={18} />}
        Lanjut QRIS
      </button>
    </form>
  );
}
