import Image from "next/image";
import { MapPin, Heart, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import ScrollReveal from "@/components/ScrollReveal";

export const metadata: Metadata = {
  title: "Sobre nosotros",
  description: "Conoce la historia de El Ropero de Carlota. Tu tienda de moda femenina en Archena, Murcia.",
};

export default function SobreNosotrosPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative h-[70vh] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?w=1920&h=1080&fit=crop"
          alt="El Ropero de Carlota"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-center justify-center text-center">
          <div>
            <p className="text-white/60 text-xs tracking-[0.4em] uppercase mb-4">
              Nuestra historia
            </p>
            <h1 className="font-serif text-4xl sm:text-6xl md:text-7xl text-white">
              Sobre <span className="italic font-light">nosotros</span>
            </h1>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <ScrollReveal>
            <p className="text-xs tracking-[0.3em] uppercase text-gold font-medium mb-6">
              Archena, Murcia
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl mb-8 leading-tight">
              Más que una tienda, un espacio donde la moda se vive y se siente
            </h2>
            <div className="w-12 h-px bg-gold mx-auto mb-8" />
            <p className="text-foreground/50 leading-relaxed text-lg">
              El Ropero de Carlota nació del sueño de crear un espacio donde cada mujer
              pudiera encontrar esa prenda especial que la hace sentir única.
            </p>
          </ScrollReveal>
        </div>
      </section>

      {/* Split image + text */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 sm:pb-28">
        <div className="grid md:grid-cols-2 gap-6">
          <ScrollReveal animation="slide-left">
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=1000&fit=crop"
                alt="Moda femenina"
                fill
                className="object-cover"
              />
            </div>
          </ScrollReveal>
          <ScrollReveal animation="slide-right">
            <div className="relative aspect-[4/5] overflow-hidden md:mt-20">
              <Image
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&h=1000&fit=crop"
                alt="Estilo"
                fill
                className="object-cover"
              />
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Values */}
      <section className="bg-cream py-20 sm:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <ScrollReveal>
            <div className="text-center mb-16">
              <p className="text-xs tracking-[0.3em] uppercase text-gold font-medium mb-3">
                Nuestros valores
              </p>
              <h2 className="font-serif text-3xl sm:text-4xl">Lo que nos define</h2>
              <div className="w-12 h-px bg-gold mx-auto mt-5" />
            </div>
          </ScrollReveal>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                icon: <Heart size={22} />,
                title: "Pasión por la moda",
                text: "Cada prenda que seleccionamos refleja nuestra pasión por vestir a la mujer moderna con piezas especiales y únicas.",
              },
              {
                icon: <Sparkles size={22} />,
                title: "Calidad accesible",
                text: "Creemos que la buena moda no tiene que ser cara. Buscamos el equilibrio perfecto entre calidad y precio justo.",
              },
              {
                icon: <MapPin size={22} />,
                title: "Raíces locales",
                text: "Orgullosamente de Archena, Murcia. Nuestro estilo mediterráneo se refleja en cada colección que ofrecemos.",
              },
            ].map((value, i) => (
              <ScrollReveal key={value.title} animation="fade-up" delay={i * 150}>
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-5 border border-gold/30 flex items-center justify-center text-gold">
                    {value.icon}
                  </div>
                  <h3 className="font-serif text-xl mb-3">{value.title}</h3>
                  <p className="text-sm text-foreground/50 leading-relaxed">
                    {value.text}
                  </p>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 sm:py-28">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <ScrollReveal>
            <p className="text-xs tracking-[0.3em] uppercase text-gold font-medium mb-6">
              El comienzo
            </p>
            <h2 className="font-serif text-3xl sm:text-4xl mb-10">Nuestra historia</h2>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={200}>
            <blockquote className="font-serif text-xl sm:text-2xl italic text-foreground/70 leading-relaxed mb-10">
              &ldquo;Lo que empezó como una pequeña tienda en el corazón de Archena
              se ha convertido en un referente de moda femenina en la comarca.&rdquo;
            </blockquote>
          </ScrollReveal>

          <ScrollReveal animation="fade-up" delay={300}>
            <div className="space-y-5 text-foreground/50 leading-relaxed">
              <p>
                Nuestra filosofía es sencilla: seleccionar cuidadosamente cada pieza,
                ofrecer un trato cercano y personalizado, y hacer que cada visita sea
                una experiencia especial.
              </p>
              <p>
                Ahora, con nuestra tienda online, queremos acercar ese mismo cariño y
                dedicación a todas las mujeres, estén donde estén.
              </p>
            </div>
          </ScrollReveal>
        </div>
      </section>

      {/* Visit us */}
      <section className="relative overflow-hidden">
        <div className="relative h-[50vh] sm:h-[60vh]">
          <Image
            src="https://images.unsplash.com/photo-1555529771-7888783a18d3?w=1920&h=800&fit=crop"
            alt="Archena, Murcia"
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-0 flex items-center justify-center text-center">
            <ScrollReveal>
              <div>
                <h2 className="font-serif text-3xl sm:text-5xl text-white mb-6">Visítanos</h2>
                <div className="w-12 h-px bg-gold mx-auto mb-6" />
                <p className="text-white/70 mb-1 text-lg">El Ropero de Carlota</p>
                <p className="text-white/50 mb-1">Archena, Murcia</p>
                <p className="text-white/50 mb-6">+34 600 000 000</p>
                <p className="text-white/40 text-sm">
                  Lunes a Sábado: 10:00 - 14:00 / 17:00 - 20:30
                </p>
              </div>
            </ScrollReveal>
          </div>
        </div>
      </section>
    </>
  );
}
