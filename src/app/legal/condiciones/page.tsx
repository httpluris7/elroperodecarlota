import type { Metadata } from "next";

export const metadata: Metadata = { title: "Condiciones de Venta" };

export default function CondicionesPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl mb-8">Condiciones de Venta</h1>
        <div className="prose prose-sm text-foreground/70 space-y-4 [&_h2]:font-serif [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3">
          <p>Última actualización: abril 2026</p>

          <h2>1. Identificación</h2>
          <p>
            El Ropero de Carlota, tienda de moda femenina ubicada en Archena, Murcia.
          </p>

          <h2>2. Productos</h2>
          <p>
            Los productos ofrecidos se presentan con la máxima exactitud posible. Los
            colores pueden variar ligeramente respecto a las fotografías debido a la
            configuración de cada pantalla.
          </p>

          <h2>3. Precios</h2>
          <p>
            Todos los precios incluyen IVA. Los gastos de envío se indican antes de
            finalizar la compra.
          </p>

          <h2>4. Proceso de compra</h2>
          <p>
            Al realizar un pedido, recibirás un email de confirmación. El contrato
            se formaliza una vez confirmado el pago a través de Stripe.
          </p>

          <h2>5. Formas de pago</h2>
          <p>
            Aceptamos pago con tarjeta de crédito/débito a través de la plataforma
            segura Stripe.
          </p>

          <h2>6. Envíos</h2>
          <p>
            Los pedidos se procesan en un plazo de 1-3 días laborables. El tiempo
            de entrega estimado es de 3-5 días laborables en península.
          </p>

          <h2>7. Garantía</h2>
          <p>
            Todos los productos cuentan con la garantía legal de conformidad de 2 años
            según la legislación vigente.
          </p>
        </div>
      </div>
    </div>
  );
}
