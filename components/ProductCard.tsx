import { ArrowRight, Code2, PackageCheck } from "lucide-react";
import Link from "next/link";
import { formatRupiah } from "@/lib/format";
import { getProductPrice, hasPromo, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const salePrice = getProductPrice(product);
  const promo = hasPromo(product);

  return (
    <article className="product-card">
      <Link href={`/products/${product.slug}`} className="product-image-link" aria-label={product.title}>
        <img src={product.image} alt="" className="product-image" />
      </Link>
      <div className="product-body">
        <div className="product-topline">
          <span className="pill">
            <Code2 size={14} />
            {product.category}
          </span>
          <span className="price-block">
            {promo ? <span className="price-old">{formatRupiah(product.price)}</span> : null}
            <span className="price">{formatRupiah(salePrice)}</span>
          </span>
        </div>
        <h2>{product.title}</h2>
        <p>{product.subtitle}</p>
        <div className="stack-row">
          {product.stack.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <div className="product-actions">
          <Link className="icon-button primary" href={`/checkout/${product.slug}`}>
            <PackageCheck size={18} />
            Beli
          </Link>
          <Link className="icon-button ghost" href={`/products/${product.slug}`} aria-label={`Detail ${product.title}`}>
            <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </article>
  );
}
