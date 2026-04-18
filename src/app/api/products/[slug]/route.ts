import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!product) {
    return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
  }

  return NextResponse.json({
    ...product,
    images: safeJsonParse<string[]>(product.images, []),
    sizes: safeJsonParse<string[]>(product.sizes, []),
    colors: safeJsonParse<string[]>(product.colors, []),
    stock: safeJsonParse<Record<string, number>>(product.stock, {}),
  });
}
