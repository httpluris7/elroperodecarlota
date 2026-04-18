import type { Metadata } from "next";

export const metadata: Metadata = { title: "Devoluciones" };

export default function DevolucionesPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl mb-8">Política de Devoluciones</h1>
        <div className="prose prose-sm text-foreground/70 space-y-4 [&_h2]:font-serif [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3">
          <p>Última actualización: abril 2026</p>

          <h2>1. Plazo de devolución</h2>
          <p>
            Dispones de 14 días naturales desde la recepción del pedido para solicitar
            una devolución, según la legislación vigente de derecho de desistimiento.
          </p>

          <h2>2. Condiciones</h2>
          <p>Para aceptar una devolución, el producto debe:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Estar sin usar y en su estado original</li>
            <li>Conservar todas las etiquetas</li>
            <li>Incluir el embalaje original</li>
          </ul>

          <h2>3. Cómo solicitar una devolución</h2>
          <p>
            Contacta con nosotros por email (info@elroperodecarlota.es) o por WhatsApp
            indicando tu número de pedido y el motivo de la devolución.
          </p>

          <h2>4. Gastos de devolución</h2>
          <p>
            Los gastos de envío de la devolución corren a cargo del cliente, salvo que
            el producto esté defectuoso o sea erróneo.
          </p>

          <h2>5. Reembolso</h2>
          <p>
            Una vez recibido y verificado el producto, realizaremos el reembolso en un
            plazo máximo de 14 días por el mismo método de pago utilizado en la compra.
          </p>

          <h2>6. Cambios</h2>
          <p>
            Si necesitas un cambio de talla o color, contacta con nosotros y te ayudaremos
            a gestionar el cambio.
          </p>
        </div>
      </div>
    </div>
  );
}
