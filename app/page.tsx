import { ProductCard } from "@/components/ProductCard";
import { Topbar } from "@/components/Topbar";
import { getAllProducts, type ProductRecord } from "@/lib/productStore";
import type { Product } from "@/lib/products";

function recordToProduct(r: ProductRecord): Product {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    subtitle: r.subtitle,
    description: r.description,
    price: r.price,
    promoPrice: r.promoPrice,
    category: r.category,
    image: r.image,
    stack: r.stack,
    includes: r.includes,
    highlights: r.highlights,
    downloadEnvKey: r.downloadEnvKey
  };
}

export default async function Home() {
  const records = await getAllProducts();
  const products = records.map(recordToProduct);

  return (
    <main>
      <Topbar />

      <section className="catalog-section" id="produk">
        <div className="section-heading">
          <h1>Produk</h1>
        </div>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </main>
  );
}
