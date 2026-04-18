import Image from "next/image";
import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  const category = await prisma.category.findUnique({ where: { slug } });
  if (!category) return { title: "Categoría no encontrada" };
  return {
    title: category.name,
    description: `Descubre nuestra selección de ${category.name.toLowerCase()} en El Ropero de Carlota.`,
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category: slug } = await params;
  const category = await prisma.category.findUnique({
    where: { slug },
  });

  if (!category) notFound();

  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  const products = await prisma.product.findMany({
    where: { active: true, categoryId: category.id },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      {/* Hero banner with category image */}
      <section className="relative h-[40vh] sm:h-[50vh] overflow-hidden">
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            priority
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sand to-sand-dark" />
        )}
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <p className="text-white/60 text-xs tracking-[0.4em] uppercase mb-3">
              {products.length} productos
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl text-white">
              {category.name}
            </h1>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Category filters */}
        <div className="flex flex-wrap gap-2 mb-10 pb-6 border-b border-sand/30">
          <Link
            href="/tienda"
            className="text-[10px] tracking-[0.15em] uppercase font-medium px-5 py-2.5 border border-foreground/15 hover:border-foreground transition-colors"
          >
            Todo
          </Link>
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/tienda/${cat.slug}`}
              className={`text-[10px] tracking-[0.15em] uppercase font-medium px-5 py-2.5 border transition-colors ${
                cat.slug === slug
                  ? "border-foreground bg-foreground text-background"
                  : "border-foreground/15 hover:border-foreground"
              }`}
            >
              {cat.name}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-foreground/50">
            <p className="text-lg mb-2">No hay productos en esta categoría</p>
            <Link href="/tienda" className="text-sm underline underline-offset-4 hover:text-gold">
              Ver toda la colección
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {products.map((product) => {
              const images = safeJsonParse<string[]>(product.images, []);
              return (
                <ProductCard
                  key={product.id}
                  name={product.name}
                  slug={product.slug}
                  price={product.price}
                  compareAtPrice={product.compareAtPrice}
                  image={images[0] || ""}
                  secondImage={images[1]}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
