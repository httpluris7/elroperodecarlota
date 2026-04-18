import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Cookies" };

export default function CookiesPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl mb-8">Política de Cookies</h1>
        <div className="prose prose-sm text-foreground/70 space-y-4 [&_h2]:font-serif [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3">
          <p>Última actualización: abril 2026</p>

          <h2>1. ¿Qué son las cookies?</h2>
          <p>
            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo
            cuando visitas nuestra web. Se utilizan para recordar tus preferencias y
            mejorar tu experiencia de navegación.
          </p>

          <h2>2. Cookies que utilizamos</h2>
          <p><strong>Cookies técnicas (necesarias):</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Carrito de compra (localStorage) — Para mantener los productos añadidos al carrito</li>
          </ul>

          <p><strong>Cookies de terceros:</strong></p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Stripe — Para procesar pagos de forma segura</li>
          </ul>

          <h2>3. Cómo gestionar las cookies</h2>
          <p>
            Puedes configurar tu navegador para bloquear o eliminar cookies. Ten en cuenta
            que bloquear las cookies técnicas puede afectar al funcionamiento de la tienda.
          </p>

          <h2>4. Contacto</h2>
          <p>
            Si tienes dudas sobre nuestra política de cookies, contacta con nosotros en
            info@elroperodecarlota.es.
          </p>
        </div>
      </div>
    </div>
  );
}
