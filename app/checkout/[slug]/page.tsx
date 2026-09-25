import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/CheckoutForm";
import { Topbar } from "@/components/Topbar";
import { formatRupiah } from "@/lib/format";
import { getProductBySlug, getProductPrice, hasPromo, products } from "@/lib/products";
import { getProductBySlug as dbGetBySlug } from "@/lib/productStore";

export function generateStaticParams() {
  return products.map((product) => ({ slug: product.slug }));
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product = getProductBySlug(slug);
  if (!product) {
    const record = await dbGetBySlug(slug);
    if (record) {
      product = {
        id: record.id,
        slug: record.slug,
        title: record.title,
        subtitle: record.subtitle,
        description: record.description,
        price: record.price,
        promoPrice: record.promoPrice,
        category: record.category,
        image: record.image,
        stack: record.stack,
        includes: record.includes,
        highlights: record.highlights,
        downloadEnvKey: record.downloadEnvKey
      };
    }
  }
  if (!product) notFound();
  const salePrice = getProductPrice(product);
  const promo = hasPromo(product);

  return (
    <main>
      <Topbar />
      <div className="topbar topbar-sub">
        <span />
        <Link className="back-link" href={`/products/${product.slug}`}>
          <ArrowLeft size={17} />
          Detail
        </Link>
      </div>

      <section className="checkout-layout">
        <div className="checkout-summary">
          <img src={product.image} alt="" />
          <span className="eyebrow">{product.category}</span>
          <h1>{product.title}</h1>
          <p>{product.subtitle}</p>
          <strong className="summary-price">
            {promo ? <span className="price-old">{formatRupiah(product.price)}</span> : null}
            <span>{formatRupiah(salePrice)}</span>
          </strong>
        </div>
        <CheckoutForm product={product} />
      </section>
    </main>
  );
}
