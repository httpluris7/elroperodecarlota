import Image from "next/image";
import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Explora toda nuestra colección de moda femenina. Vestidos, tops, pantalones, faldas y accesorios.",
};

export default async function TiendaPage({
  searchParams,
}: {
  searchParams: Promise<{ orden?: string }>;
}) {
  const params = await searchParams;
  const categories = await prisma.category.findMany({
    where: { active: true },
    orderBy: { order: "asc" },
  });

  let orderBy: Record<string, string> = { createdAt: "desc" };
  if (params.orden === "precio-asc") orderBy = { price: "asc" };
  if (params.orden === "precio-desc") orderBy = { price: "desc" };
  if (params.orden === "nombre") orderBy = { name: "asc" };

  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy,
  });

  return (
    <>
      {/* Hero banner */}
      <section className="relative h-[40vh] sm:h-[50vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1445205170230-053b83016050?w=1920&h=800&fit=crop"
          alt="Tienda"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <p className="text-white/60 text-xs tracking-[0.4em] uppercase mb-3">
              {products.length} productos
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl text-white">
              Nuestra <span className="italic font-light">colección</span>
            </h1>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-10 pb-6 border-b border-sand/30">
          <div className="flex flex-wrap gap-2">
            <Link
              href="/tienda"
              className="text-[10px] tracking-[0.15em] uppercase font-medium px-5 py-2.5 border border-foreground bg-foreground text-background"
            >
              Todo
            </Link>
            {categories.map((cat) => (
              <Link
                key={cat.id}
                href={`/tienda/${cat.slug}`}
                className="text-[10px] tracking-[0.15em] uppercase font-medium px-5 py-2.5 border border-foreground/15 hover:border-foreground transition-colors"
              >
                {cat.name}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4 text-[10px] tracking-wider uppercase">
            <span className="text-foreground/30">Ordenar:</span>
            <Link href="/tienda?orden=precio-asc" className="hover:text-gold transition-colors">
              Precio ↑
            </Link>
            <Link href="/tienda?orden=precio-desc" className="hover:text-gold transition-colors">
              Precio ↓
            </Link>
            <Link href="/tienda?orden=nombre" className="hover:text-gold transition-colors">
              Nombre
            </Link>
          </div>
        </div>

        {/* Products grid */}
        {products.length === 0 ? (
          <div className="text-center py-20 text-foreground/50">
            <p className="text-lg mb-2">No hay productos disponibles</p>
            <p className="text-sm">Vuelve pronto, estamos preparando nuevas prendas.</p>
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
                  category={product.category.name}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
