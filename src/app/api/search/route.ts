import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { safeJsonParse, fuzzyMatch } from "@/lib/utils";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();

  if (!query || query.length < 2) {
    return NextResponse.json([]);
  }

  // Get all active products (for a small store this is fine; for large catalogs use DB search)
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
  });

  // Score each product against the query using fuzzy matching
  const scored = products
    .map((product) => {
      const images = safeJsonParse<string[]>(product.images, []);
      const sizes = safeJsonParse<string[]>(product.sizes, []);
      const colors = safeJsonParse<string[]>(product.colors, []);

      // Match against multiple fields with different weights
      const nameScore = fuzzyMatch(query, product.name) * 1.0;
      const categoryScore = fuzzyMatch(query, product.category.name) * 0.7;
      const descScore = fuzzyMatch(query, product.description) * 0.3;
      const colorScore = Math.max(...colors.map((c) => fuzzyMatch(query, c)), 0) * 0.5;
      const sizeScore = Math.max(...sizes.map((s) => fuzzyMatch(query, s)), 0) * 0.4;

      const score = Math.max(nameScore, categoryScore, descScore, colorScore, sizeScore);

      return {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        image: images[0] || "",
        category: product.category.name,
        categorySlug: product.category.slug,
        score,
      };
    })
    .filter((p) => p.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return NextResponse.json(scored);
}
