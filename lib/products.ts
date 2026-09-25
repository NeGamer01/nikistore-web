import productData from "@/data/products.json";

type ProductBase = {
  id: string;
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
};

export type SourceProduct = ProductBase & {
  type?: "source";
  downloadEnvKey: string;
};

export type Product = SourceProduct;

export const products = productData as Product[];

export function getProductPrice(product: Product) {
  return product.promoPrice && product.promoPrice > 0 && product.promoPrice < product.price
    ? product.promoPrice
    : product.price;
}

export function hasPromo(product: Product) {
  return getProductPrice(product) < product.price;
}

export function getProductBySlug(slug: string) {
  return products.find((product) => product.slug === slug);
}

export function getProductById(id: string) {
  return products.find((product) => product.id === id);
}

export function getDownloadUrl(product: Product) {
  const value = process.env[product.downloadEnvKey];
  return value && /^https?:\/\//i.test(value) ? value : null;
}
