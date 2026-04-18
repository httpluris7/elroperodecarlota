import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import ProductCard from "@/components/ProductCard";
import CategoryCard from "@/components/CategoryCard";
import Marquee from "@/components/Marquee";
import ScrollReveal from "@/components/ScrollReveal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, featuredProducts, allProducts] = await Promise.all([
    prisma.category.findMany({
      where: { active: true },
      orderBy: { order: "asc" },
    }),
    prisma.product.findMany({
      where: { active: true, featured: true },
      include: { category: true },
      take: 5,
      orderBy: { createdAt: "desc" },
    }),
    prisma.product.findMany({
      where: { active: true },
      include: { category: true },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      {/* ===== HERO ===== */}
      <section className="relative h-screen overflow-hidden">
        {/* Background image with zoom animation */}
        <div className="absolute inset-0 animate-hero-zoom">
          <Image
            src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1920&h=1080&fit=crop&q=80"
            alt="Moda femenina"
            fill
            priority
            className="object-cover"
          />
        </div>
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60" />

        {/* Hero content */}
        <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
          <p className="text-white/70 text-xs sm:text-sm tracking-[0.4em] uppercase mb-6 animate-fade-in delay-200">
            Archena, Murcia
          </p>
          <h1 className="font-serif text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-white leading-[0.9] mb-8 animate-fade-up delay-300">
            El Ropero
            <br />
            <span className="italic font-light">de Carlota</span>
          </h1>
          <p className="text-white/70 max-w-md text-sm sm:text-base leading-relaxed mb-10 animate-fade-in delay-500">
            Piezas cuidadosamente seleccionadas para que
            te sientas única cada día
          </p>
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-up delay-600">
            <Link
              href="/tienda"
              className="group bg-white text-foreground px-10 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-gold hover:text-white transition-all duration-500 flex items-center gap-3"
            >
              Descubrir colección
              <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/sobre-nosotros"
              className="border border-white/40 text-white px-10 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-white hover:text-foreground transition-all duration-500"
            >
              Nuestra historia
            </Link>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-float">
          <div className="w-px h-16 bg-gradient-to-b from-transparent to-white/60" />
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <Marquee text="NUEVA COLECCIÓN PRIMAVERA-VERANO 2026" />

      {/* ===== CATEGORIES ===== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal animation="fade-up">
            <div className="text-center mb-14">
              <p className="text-xs tracking-[0.3em] uppercase text-gold font-medium mb-3">
                Explora
              </p>
              <h2 className="font-serif text-3xl sm:text-5xl">Categorías</h2>
              <div className="w-12 h-px bg-gold mx-auto mt-5" />
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {categories.slice(0, 3).map((cat, i) => (
              <ScrollReveal key={cat.id} animation="scale-in" delay={i * 150}>
                <CategoryCard name={cat.name} slug={cat.slug} image={cat.image} />
              </ScrollReveal>
            ))}
          </div>
          {categories.length > 3 && (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
              {categories.slice(3, 5).map((cat, i) => (
                <ScrollReveal key={cat.id} animation="scale-in" delay={(i + 3) * 150}>
                  <CategoryCard name={cat.name} slug={cat.slug} image={cat.image} />
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ===== FEATURED SPLIT ===== */}
      {featuredProducts.length >= 2 && (
        <section className="bg-cream">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 min-h-[80vh]">
              {/* Left: Image */}
              <ScrollReveal animation="slide-left" className="relative">
                <div className="relative h-full min-h-[60vh]">
                  <Image
                    src={safeJsonParse<string[]>(featuredProducts[0].images, [])[0]}
                    alt={featuredProducts[0].name}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-cream/20" />
                </div>
              </ScrollReveal>

              {/* Right: Content */}
              <ScrollReveal animation="slide-right" className="flex items-center">
                <div className="px-8 sm:px-12 lg:px-20 py-16">
                  <p className="text-xs tracking-[0.3em] uppercase text-gold font-medium mb-4">
                    Destacado
                  </p>
                  <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-6 leading-tight">
                    {featuredProducts[0].name}
                  </h2>
                  <p className="text-foreground/50 leading-relaxed mb-8 max-w-md">
                    {featuredProducts[0].description}
                  </p>
                  <div className="flex items-center gap-4 mb-10">
                    <span className="text-2xl font-serif">
                      {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(featuredProducts[0].price)}
                    </span>
                    {featuredProducts[0].compareAtPrice && (
                      <span className="text-lg text-foreground/30 line-through">
                        {new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(featuredProducts[0].compareAtPrice)}
                      </span>
                    )}
                  </div>
                  <Link
                    href={`/producto/${featuredProducts[0].slug}`}
                    className="group inline-flex items-center gap-3 bg-foreground text-background px-10 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-gold transition-colors duration-500"
                  >
                    Ver producto
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>
      )}

      {/* ===== PRODUCTS GRID ===== */}
      <section className="py-20 sm:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="flex items-end justify-between mb-14">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-gold font-medium mb-3">
                  Colección
                </p>
                <h2 className="font-serif text-3xl sm:text-5xl">Lo más nuevo</h2>
              </div>
              <Link
                href="/tienda"
                className="hidden sm:flex items-center gap-2 text-xs tracking-[0.15em] uppercase font-medium border-b border-foreground pb-1 hover:text-gold hover:border-gold transition-colors"
              >
                Ver todo
                <ArrowRight size={13} />
              </Link>
            </div>
          </ScrollReveal>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 sm:gap-x-6 gap-y-10">
            {allProducts.slice(0, 8).map((product, i) => {
              const images = safeJsonParse<string[]>(product.images, []);
              return (
                <ScrollReveal key={product.id} animation="fade-up" delay={i * 100}>
                  <ProductCard
                    name={product.name}
                    slug={product.slug}
                    price={product.price}
                    compareAtPrice={product.compareAtPrice}
                    image={images[0] || ""}
                    secondImage={images[1]}
                    category={product.category.name}
                  />
                </ScrollReveal>
              );
            })}
          </div>

          <ScrollReveal>
            <div className="text-center mt-14">
              <Link
                href="/tienda"
                className="group inline-flex items-center gap-3 border border-foreground px-10 py-4 text-xs tracking-[0.2em] uppercase font-medium hover:bg-foreground hover:text-background transition-all duration-500"
              >
                Ver toda la colección
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* ===== ABOUT / BRAND STORY ===== */}
      <section className="relative overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Image side */}
          <ScrollReveal animation="slide-left" className="relative min-h-[60vh] md:min-h-[90vh]">
            <Image
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1000&h=1200&fit=crop"
              alt="Interior tienda El Ropero de Carlota"
              fill
              className="object-cover"
            />
          </ScrollReveal>

          {/* Text side */}
          <div className="bg-foreground text-background flex items-center">
            <ScrollReveal animation="slide-right">
              <div className="px-8 sm:px-12 lg:px-20 py-20">
                <p className="text-xs tracking-[0.3em] uppercase text-gold font-medium mb-6">
                  Nuestra esencia
                </p>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-8 leading-tight text-background">
                  Moda con
                  <br />
                  <span className="italic">alma propia</span>
                </h2>
                <div className="w-12 h-px bg-gold mb-8" />
                <p className="text-background/50 leading-relaxed mb-6">
                  En El Ropero de Carlota creemos que vestirse es una forma de
                  expresión. Cada prenda ha sido seleccionada pensando en la mujer
                  que la llevará.
                </p>
                <p className="text-background/50 leading-relaxed mb-10">
                  Desde nuestra tienda en Archena, Murcia, te ofrecemos piezas
                  que combinan tendencia y atemporalidad, calidad y precio justo.
                </p>
                <Link
                  href="/sobre-nosotros"
                  className="group inline-flex items-center gap-3 border border-background/30 px-10 py-4 text-xs tracking-[0.2em] uppercase font-medium text-background hover:bg-background hover:text-foreground transition-all duration-500"
                >
                  Conoce nuestra historia
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </Link>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>

      {/* ===== INSTAGRAM / SOCIAL ===== */}
      <section className="py-20 sm:py-28">
        <ScrollReveal>
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-gold font-medium mb-3">
              Síguenos
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl mb-3">@elroperodecarlota</h2>
            <p className="text-foreground/40 text-sm">
              Descubre inspiración diaria en nuestro Instagram
            </p>
          </div>
        </ScrollReveal>

        {/* Instagram-style grid (using product images as feed) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
          {allProducts.slice(0, 4).map((product, i) => {
            const images = safeJsonParse<string[]>(product.images, []);
            return (
              <ScrollReveal key={product.id} animation="scale-in" delay={i * 100}>
                <a
                  href="https://instagram.com/elroperodecarlota"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative aspect-square overflow-hidden block"
                >
                  <Image
                    src={images[0]}
                    alt={product.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/30 transition-colors duration-300 flex items-center justify-center">
                    <svg className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                  </div>
                </a>
              </ScrollReveal>
            );
          })}
        </div>
      </section>
    </>
  );
}
