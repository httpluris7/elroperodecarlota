"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useCart } from "@/hooks/use-cart";
import { SearchTrigger } from "@/components/SearchModal";

const CATEGORIES = [
  { href: "/tienda/vestidos", label: "Vestidos" },
  { href: "/tienda/tops-y-blusas", label: "Tops y Blusas" },
  { href: "/tienda/pantalones", label: "Pantalones" },
  { href: "/tienda/faldas", label: "Faldas" },
  { href: "/tienda/accesorios", label: "Accesorios" },
];

// Pages that have a dark full-bleed hero behind the navbar
const DARK_HERO_ROUTES = ["/", "/tienda", "/sobre-nosotros"];

function hasDarkHero(pathname: string): boolean {
  if (DARK_HERO_ROUTES.includes(pathname)) return true;
  // /tienda/[category] pages also have dark heroes
  if (pathname.startsWith("/tienda/")) return true;
  return false;
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [shopOpen, setShopOpen] = useState(false);
  const { toggleCart, totalItems } = useCart();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const darkHero = hasDarkHero(pathname);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const count = mounted ? totalItems() : 0;
  // Only use white text on pages with dark hero AND before scrolling
  const textColor = scrolled || !darkHero ? "text-foreground" : "text-white";
  const linkClass = `text-[11px] tracking-[0.2em] uppercase font-medium transition-colors hover:text-gold ${textColor}`;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-background/95 backdrop-blur-md shadow-sm py-2"
            : darkHero
              ? "bg-transparent py-4"
              : "bg-background/95 backdrop-blur-md py-3"
        }`}
      >
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Hamburger (mobile) + Nav (desktop) */}
            <div className="flex items-center gap-6">
              <button
                onClick={() => setMenuOpen(true)}
                className={`lg:hidden p-1 transition-colors hover:text-gold ${textColor}`}
                aria-label="Menú"
              >
                <Menu size={22} />
              </button>

              <div className="hidden lg:flex items-center gap-8">
                {/* Tienda with dropdown */}
                <div
                  className="relative"
                  onMouseEnter={() => setShopOpen(true)}
                  onMouseLeave={() => setShopOpen(false)}
                >
                  <Link href="/tienda" className={`${linkClass} flex items-center gap-1`}>
                    Tienda
                    <ChevronDown
                      size={12}
                      className={`transition-transform ${shopOpen ? "rotate-180" : ""}`}
                    />
                  </Link>

                  {/* Dropdown */}
                  <div
                    className={`absolute top-full left-0 pt-3 transition-all duration-300 ${
                      shopOpen
                        ? "opacity-100 translate-y-0 pointer-events-auto"
                        : "opacity-0 -translate-y-2 pointer-events-none"
                    }`}
                  >
                    <div className="bg-background shadow-lg border border-sand/20 min-w-[200px] py-3">
                      <Link
                        href="/tienda"
                        className="block px-6 py-2.5 text-[11px] tracking-[0.15em] uppercase text-foreground/60 hover:text-gold hover:bg-sand/10 transition-colors"
                      >
                        Ver todo
                      </Link>
                      <div className="h-px bg-sand/20 mx-4 my-1" />
                      {CATEGORIES.map((cat) => (
                        <Link
                          key={cat.href}
                          href={cat.href}
                          className="block px-6 py-2.5 text-[11px] tracking-[0.15em] uppercase text-foreground/60 hover:text-gold hover:bg-sand/10 transition-colors"
                        >
                          {cat.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>

                <Link href="/novedades" className={linkClass}>
                  Novedades
                </Link>
                <Link href="/sobre-nosotros" className={linkClass}>
                  Nosotros
                </Link>
              </div>
            </div>

            {/* Center: Logo */}
            <Link href="/" className="absolute left-1/2 -translate-x-1/2">
              <h1
                className={`font-serif text-lg sm:text-xl tracking-[0.05em] transition-colors whitespace-nowrap ${textColor}`}
              >
                El Ropero <span className="italic font-light">de Carlota</span>
              </h1>
            </Link>

            {/* Right: Search + Cart */}
            <div className="flex items-center gap-4">
              <SearchTrigger
                className={`p-1 transition-colors hover:text-gold ${textColor}`}
              />
              <button
                onClick={toggleCart}
                className={`relative p-1 transition-colors hover:text-gold ${textColor}`}
                aria-label="Carrito"
              >
                <ShoppingBag size={20} />
                {count > 0 && (
                  <span className="absolute -top-1 -right-1.5 bg-gold text-white text-[9px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center leading-none">
                    {count}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile fullscreen menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-[60] bg-foreground text-background">
          <div className="flex justify-end p-5">
            <button onClick={() => setMenuOpen(false)} aria-label="Cerrar menú">
              <X size={24} className="text-background" />
            </button>
          </div>
          <div className="flex flex-col items-center justify-center h-[70vh] gap-6">
            {/* Tienda as header, categories below */}
            <Link
              href="/tienda"
              onClick={() => setMenuOpen(false)}
              className="font-serif text-3xl sm:text-4xl text-background hover:text-gold transition-colors"
            >
              Tienda
            </Link>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-3">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  onClick={() => setMenuOpen(false)}
                  className="text-xs tracking-[0.15em] uppercase text-background/40 hover:text-gold transition-colors"
                >
                  {cat.label}
                </Link>
              ))}
            </div>

            <div className="w-8 h-px bg-background/15 my-2" />

            <Link
              href="/novedades"
              onClick={() => setMenuOpen(false)}
              className="font-serif text-3xl sm:text-4xl text-background hover:text-gold transition-colors"
            >
              Novedades
            </Link>
            <Link
              href="/sobre-nosotros"
              onClick={() => setMenuOpen(false)}
              className="font-serif text-3xl sm:text-4xl text-background hover:text-gold transition-colors"
            >
              Nosotros
            </Link>
          </div>
          <div className="text-center">
            <a
              href="https://instagram.com/elroperodecarlota"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs tracking-[0.2em] uppercase text-background/40 hover:text-gold transition-colors"
            >
              @elroperodecarlota
            </a>
          </div>
        </div>
      )}
    </>
  );
}
