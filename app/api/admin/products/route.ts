import { NextResponse } from "next/server";
import { createProduct, getAllProductsAdmin, updateProduct, deleteProduct } from "@/lib/productStore";

export const runtime = "nodejs";

export async function GET() {
  try {
    const products = await getAllProductsAdmin();
    return NextResponse.json({ products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal mengambil products.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.slug || !body.title || !body.price) {
      return NextResponse.json({ message: "Field slug, title, dan price wajib." }, { status: 400 });
    }
    const id = await createProduct({
      slug: body.slug,
      title: body.title,
      subtitle: body.subtitle || "",
      description: body.description || "",
      price: Number(body.price) || 0,
      promoPrice: body.promoPrice ? Number(body.promoPrice) : undefined,
      category: body.category || "",
      image: body.image || "",
      stack: body.stack || [],
      includes: body.includes || [],
      highlights: body.highlights || [],
      downloadEnvKey: body.downloadEnvKey || "",
      active: true
    });
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal membuat product.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ message: "Field id wajib." }, { status: 400 });
    }
    await updateProduct(body.id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal update product.";
    return NextResponse.json({ message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ message: "Field id wajib." }, { status: 400 });
    }
    await deleteProduct(body.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Gagal delete product.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
