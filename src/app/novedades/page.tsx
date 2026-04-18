import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { safeJsonParse, formatPrice } from "@/lib/utils";
import type { Metadata } from "next";
import { ArrowUpRight } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Novedades",
  description:
    "Lo último en llegar a El Ropero de Carlota. Descubre las prendas más nuevas de nuestra colección.",
};

export default async function NovedadesPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 12,
  });

  // Split: first product = hero feature, rest = grid
  const hero = products[0];
  const heroImages = hero ? safeJsonParse<string[]>(hero.images, []) : [];
  const secondary = products.slice(1, 3);
  const rest = products.slice(3);

  return (
    <>
      {/* Header */}
      <section className="pt-28 sm:pt-36 pb-8 sm:pb-12 text-center px-4">
        <p className="text-[10px] tracking-[0.4em] uppercase text-gold mb-4 font-medium">
          Recién llegado
        </p>
        <h1 className="font-serif text-4xl sm:text-6xl lg:text-7xl mb-4">
          Novedades
        </h1>
        <p className="text-foreground/40 text-sm max-w-md mx-auto leading-relaxed">
          Las últimas prendas que hemos seleccionado para ti.
          Piezas frescas, estilos nuevos.
        </p>
      </section>

      {/* Hero product — full width cinematic */}
      {hero && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16 sm:mb-24">
          <Link href={`/producto/${hero.slug}`} className="group block">
            <div className="relative aspect-[16/9] sm:aspect-[21/9] overflow-hidden bg-sand/20">
              {heroImages[0] && (
                <Image
                  src={heroImages[0]}
                  alt={hero.name}
                  fill
                  priority
                  sizes="100vw"
                  className="object-cover transition-transform duration-[1.2s] group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              {/* Badge */}
              <div className="absolute top-4 sm:top-6 left-4 sm:left-6">
                <span className="bg-gold text-white text-[9px] tracking-[0.2em] uppercase font-semibold px-3 py-1.5">
                  Nuevo
                </span>
              </div>

              {/* Info overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 lg:p-10">
                <p className="text-white/50 text-[10px] tracking-[0.3em] uppercase mb-2">
                  {hero.category.name}
                </p>
                <h2 className="font-serif text-2xl sm:text-4xl lg:text-5xl text-white mb-3 group-hover:text-gold transition-colors duration-500">
                  {hero.name}
                </h2>
                <div className="flex items-center gap-4">
                  <span className="text-white text-lg font-medium">
                    {formatPrice(hero.price)}
                  </span>
                  {hero.compareAtPrice && hero.compareAtPrice > hero.price && (
                    <span className="text-white/40 line-through text-sm">
                      {formatPrice(hero.compareAtPrice)}
                    </span>
                  )}
                  <span className="ml-auto text-white/60 text-xs tracking-[0.15em] uppercase flex items-center gap-1 group-hover:text-gold transition-colors">
                    Ver producto
                    <ArrowUpRight size={14} />
                  </span>
                </div>
              </div>
            </div>
          </Link>
        </section>
      )}

      {/* Secondary — 2 column editorial */}
      {secondary.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-16 sm:mb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {secondary.map((product) => {
              const images = safeJsonParse<string[]>(product.images, []);
              return (
                <Link
                  key={product.id}
                  href={`/producto/${product.slug}`}
                  className="group block"
                >
                  <div className="relative aspect-[3/4] overflow-hidden bg-sand/20">
                    {images[0] && (
                      <Image
                        src={images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 100vw, 50vw"
                        className="object-cover transition-transform duration-[1s] group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="bg-foreground text-background text-[9px] tracking-[0.2em] uppercase font-semibold px-3 py-1.5">
                        Nuevo
                      </span>
                    </div>

                    {/* Hover info */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                      <p className="text-white/60 text-[10px] tracking-[0.3em] uppercase mb-1">
                        {product.category.name}
                      </p>
                      <h3 className="font-serif text-xl sm:text-2xl text-white mb-1">
                        {product.name}
                      </h3>
                      <span className="text-white font-medium text-sm">
                        {formatPrice(product.price)}
                      </span>
                    </div>
                  </div>

                  {/* Info below image (visible by default) */}
                  <div className="mt-3">
                    <p className="text-[10px] tracking-[0.2em] uppercase text-gold mb-1 font-medium">
                      {product.category.name}
                    </p>
                    <h3 className="text-sm group-hover:text-gold transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm font-medium">
                        {formatPrice(product.price)}
                      </span>
                      {product.compareAtPrice &&
                        product.compareAtPrice > product.price && (
                          <span className="text-xs text-foreground/35 line-through">
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Divider */}
      {rest.length > 0 && (
        <div className="flex items-center gap-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
          <div className="flex-1 h-px bg-sand/30" />
          <p className="text-[10px] tracking-[0.3em] uppercase text-foreground/30 font-medium">
            Más novedades
          </p>
          <div className="flex-1 h-px bg-sand/30" />
        </div>
      )}

      {/* Rest — classic grid */}
      {rest.length > 0 && (
        <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-20 sm:mb-28">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {rest.map((product) => {
              const images = safeJsonParse<string[]>(product.images, []);
              return (
                <Link
                  key={product.id}
                  href={`/producto/${product.slug}`}
                  className="group block hover-lift"
                >
                  <div className="relative aspect-[3/4] bg-sand/20 overflow-hidden mb-3">
                    {images[0] && (
                      <Image
                        src={images[0]}
                        alt={product.name}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover transition-all duration-700 group-hover:scale-110"
                      />
                    )}
                    {images[1] && (
                      <Image
                        src={images[1]}
                        alt={`${product.name} - vista 2`}
                        fill
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        className="object-cover absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                      />
                    )}
                    <div className="product-card-overlay absolute inset-0 bg-black/10 flex items-end justify-center pb-5">
                      <span className="bg-white text-foreground text-[10px] tracking-[0.15em] uppercase px-5 py-2 flex items-center gap-1.5 font-medium">
                        Ver producto
                        <ArrowUpRight size={12} />
                      </span>
                    </div>
                  </div>
                  <p className="text-[10px] tracking-[0.2em] uppercase text-gold mb-1 font-medium">
                    {product.category.name}
                  </p>
                  <h3 className="text-sm group-hover:text-gold transition-colors">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-medium">
                      {formatPrice(product.price)}
                    </span>
                    {product.compareAtPrice &&
                      product.compareAtPrice > product.price && (
                        <span className="text-xs text-foreground/35 line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* CTA to full shop */}
      <section className="border-t border-sand/30 py-16 sm:py-20 text-center px-4">
        <p className="text-foreground/30 text-xs tracking-[0.2em] uppercase mb-5">
          Explora todo
        </p>
        <Link
          href="/tienda"
          className="inline-block border border-foreground text-[11px] tracking-[0.2em] uppercase font-medium px-10 py-4 hover:bg-foreground hover:text-background transition-all duration-300"
        >
          Ver toda la colección
        </Link>
      </section>
    </>
  );
}
