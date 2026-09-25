import { ArrowLeft, QrCode } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CopyTextButton } from "@/components/CopyTextButton";
import { RenewWatcher } from "@/components/RenewWatcher";
import { Topbar } from "@/components/Topbar";
import { compactDateTime, formatRupiah } from "@/lib/format";
import { createQrisPayment } from "@/lib/paygateway";
import { createHmac } from "crypto";

export const runtime = "nodejs";

type RenewToken = {
  orderId: string;
  type: "renew";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  serverName: string;
  amount: number;
  uniqueCode: number;
  createdAt: number;
  expiresAt: number;
};

function verifyToken(token: string): RenewToken | null {
  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;

  const secret = process.env.JWT_SECRET || "default-secret";
  const expected = createHmac("sha256", secret)
    .update(payloadB64)
    .digest("hex");

  if (expected !== signature) return null;

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64").toString("utf8"));
    if (payload.type !== "renew") return null;
    return payload as RenewToken;
  } catch {
    return null;
  }
}

export default async function RenewPayPage({
  params
}: {
  params: Promise<{ orderId: string; token: string }>;
}) {
  const { orderId, token } = await params;
  const decoded = decodeURIComponent(token);

  const renewData = verifyToken(decoded);
  if (!renewData) {
    notFound();
  }

  if (renewData.orderId !== orderId) {
    notFound();
  }

  let qris;
  let qrisError = "";
  try {
    qris = await createQrisPayment(renewData.amount, `renew-${renewData.orderId}-${Date.now()}`);
  } catch (error) {
    qrisError = error instanceof Error ? error.message : "Gagal membuat QRIS.";
  }

  return (
    <main>
      <Topbar />

      <div className="topbar topbar-sub">
        <span />
        <Link className="back-link" href={`/renew/${orderId}`}>
          <ArrowLeft size={17} />
          Perpanjang Server
        </Link>
      </div>

      <section className="payment-layout">
        <div className="qris-panel">
          <span className="eyebrow">Perpanjangan {renewData.orderId}</span>
          <h1>{formatRupiah(renewData.amount)}</h1>
          <p>Termasuk kode unik {formatRupiah(renewData.uniqueCode)}. Berlaku sampai {compactDateTime(renewData.expiresAt)}.</p>
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
            <span className="eyebrow">Perpanjangan Server</span>
            <h2>{renewData.serverName}</h2>
            <p>30 hari perpanjangan</p>
            <p>{renewData.customerEmail}</p>
            <p>{renewData.customerPhone}</p>
          </div>
          <div className="invoice-lines">
            <div>
              <span>Harga</span>
              <strong>{formatRupiah(renewData.amount - renewData.uniqueCode)}</strong>
            </div>
            <div>
              <span>Kode unik</span>
              <strong>{formatRupiah(renewData.uniqueCode)}</strong>
            </div>
            <div>
              <span>Total</span>
              <strong>{formatRupiah(renewData.amount)}</strong>
            </div>
          </div>
          <RenewWatcher token={decoded} amount={renewData.amount} uniqueCode={renewData.uniqueCode} />
          {qris?.qrisString ? (
            <CopyTextButton text={qris.qrisString} label="Copy QRIS string" />
          ) : null}
        </aside>
      </section>
    </main>
  );
}
