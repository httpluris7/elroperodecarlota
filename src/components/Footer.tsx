import Link from "next/link";
import { MapPin, Phone, Mail } from "lucide-react";
import NewsletterForm from "./NewsletterForm";

export default function Footer() {
  return (
    <footer className="bg-foreground text-background/80">
      {/* Newsletter banner */}
      <div className="border-b border-background/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h3 className="font-serif text-xl text-background mb-2">
            No te pierdas nada
          </h3>
          <p className="text-sm text-background/60 mb-6">
            Suscríbete y recibe novedades, ofertas exclusivas y más.
          </p>
          <NewsletterForm />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h3 className="font-serif text-xl text-background mb-4">
              El Ropero de Carlota
            </h3>
            <p className="text-sm leading-relaxed text-background/60">
              Tu tienda de moda femenina en Archena. Estilo, calidad y las
              últimas tendencias al mejor precio.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-serif text-background mb-4">Tienda</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/tienda" className="hover:text-gold transition-colors">
                  Ver todo
                </Link>
              </li>
              <li>
                <Link href="/tienda/vestidos" className="hover:text-gold transition-colors">
                  Vestidos
                </Link>
              </li>
              <li>
                <Link href="/tienda/tops-y-blusas" className="hover:text-gold transition-colors">
                  Tops y Blusas
                </Link>
              </li>
              <li>
                <Link href="/tienda/pantalones" className="hover:text-gold transition-colors">
                  Pantalones
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-serif text-background mb-4">Información</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/sobre-nosotros" className="hover:text-gold transition-colors">
                  Sobre nosotros
                </Link>
              </li>
              <li>
                <Link href="/legal/privacidad" className="hover:text-gold transition-colors">
                  Política de privacidad
                </Link>
              </li>
              <li>
                <Link href="/legal/cookies" className="hover:text-gold transition-colors">
                  Política de cookies
                </Link>
              </li>
              <li>
                <Link href="/legal/condiciones" className="hover:text-gold transition-colors">
                  Condiciones de venta
                </Link>
              </li>
              <li>
                <Link href="/legal/devoluciones" className="hover:text-gold transition-colors">
                  Devoluciones
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif text-background mb-4">Contacto</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <MapPin size={16} className="shrink-0" />
                <span>Archena, Murcia</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="shrink-0" />
                <span>+34 600 000 000</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="shrink-0" />
                <span>info@elroperodecarlota.es</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                <a
                  href="https://instagram.com/elroperodecarlota"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-gold transition-colors"
                >
                  @elroperodecarlota
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 mt-12 pt-8 text-center text-xs text-background/40">
          <p>© {new Date().getFullYear()} El Ropero de Carlota. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
