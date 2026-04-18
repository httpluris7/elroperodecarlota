import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const featured = searchParams.get("featured");

  const where: Record<string, unknown> = { active: true };
  if (category) {
    where.category = { slug: category };
  }
  if (featured === "true") {
    where.featured = true;
  }

  const products = await prisma.product.findMany({
    where,
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const formatted = products.map((p) => ({
    ...p,
    images: safeJsonParse<string[]>(p.images, []),
    sizes: safeJsonParse<string[]>(p.sizes, []),
    colors: safeJsonParse<string[]>(p.colors, []),
  }));

  return NextResponse.json(formatted);
}
