import { prisma } from "@/lib/db";
import type { MetadataRoute } from "next";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const products = await prisma.product.findMany({
    where: { active: true },
    select: { slug: true, createdAt: true },
  });

  const categories = await prisma.category.findMany({
    where: { active: true },
    select: { slug: true },
  });

  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "daily", priority: 1 },
    { url: `${baseUrl}/tienda`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/sobre-nosotros`, changeFrequency: "monthly", priority: 0.5 },
    ...categories.map((cat) => ({
      url: `${baseUrl}/tienda/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...products.map((product) => ({
      url: `${baseUrl}/producto/${product.slug}`,
      lastModified: product.createdAt,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
