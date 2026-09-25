import { ArrowLeft, QrCode } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyTextButton } from "@/components/CopyTextButton";
import { PaymentWatcher } from "@/components/PaymentWatcher";
import { Topbar } from "@/components/Topbar";
import { compactDateTime, formatRupiah } from "@/lib/format";
import { createQrisPayment } from "@/lib/paygateway";
import { isPanelOrder, verifyOrderToken } from "@/lib/orders";
import { describeSelection } from "@/lib/panelPricing";
import { getProductById } from "@/lib/products";

export const runtime = "nodejs";

export default async function PayPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  let order;
  try {
    order = verifyOrderToken(decodeURIComponent(token));
  } catch {
    notFound();
  }

  let title: string;
  let subtitle: string;
  let backHref: string;
  let backLabel: string;

  if (isPanelOrder(order)) {
    title = `Panel ${order.panel.serverName}`;
    subtitle = describeSelection(order.panel.selection);
    backHref = "/panel";
    backLabel = "Order Panel";
  } else {
    const product = getProductById(order.productId);
    if (!product) notFound();
    title = product.title;
    subtitle = product.subtitle;
    backHref = `/checkout/${product.slug}`;
    backLabel = "Checkout";
  }

  let qris;
  let qrisError = "";
  try {
    qris = await createQrisPayment(order.amount, order.id);
    // Simpan qris_id ke DB supaya webhook & polling bisa cocokin order.
    order.qrisId = qris.qrisId;
    const { saveOrder } = await import("@/lib/db");
    saveOrder({ ...order, qrisId: qris.qrisId });
  } catch (error) {
    qrisError = error instanceof Error ? error.message : "Gagal membuat QRIS.";
  }

  return (
    <main>
      <Topbar />

      <div className="topbar topbar-sub">
        <span />
        <Link className="back-link" href={backHref}>
          <ArrowLeft size={17} />
          {backLabel}
        </Link>
      </div>

      <section className="payment-layout">
        <div className="qris-panel">
          <span className="eyebrow">Invoice {order.id}</span>
          <h1>{formatRupiah(order.amount)}</h1>
          <p>Termasuk kode unik {order.uniqueCode}. Berlaku sampai {compactDateTime(order.paymentExpiresAt)}.</p>
          {qris ? (
            <>
              <div className="qr-frame">
                <img src={qris.qrisUrl} alt="QRIS pembayaran" />
              </div>
              {qris.qrisString ? null : <p className="form-error">QR image dimuat dari PayGateway.</p>}
            </>
          ) : (
            <div className="qr-error">{qrisError}</div>
          )}
        </div>

        <aside className="invoice-panel">
          <div>
            <span className="eyebrow">{isPanelOrder(order) ? "Order Panel" : "Produk"}</span>
            <h2>{title}</h2>
            <p>{subtitle}</p>
            <p>{order.customerEmail}</p>
            <p>{order.customerPhone}</p>
          </div>
          <div className="invoice-lines">
            <div>
              <span>Harga</span>
              <strong>{formatRupiah(order.basePrice)}</strong>
            </div>
            <div>
              <span>Kode unik</span>
              <strong>{formatRupiah(order.uniqueCode)}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatRupiah(order.amount)}</strong>
            </div>
          </div>
          <PaymentWatcher token={decodeURIComponent(token)} />
          {qris?.qrisString ? (
            <CopyTextButton text={qris.qrisString} label="Copy QRIS string" />
          ) : null}
        </aside>
      </section>
    </main>
  );
}
