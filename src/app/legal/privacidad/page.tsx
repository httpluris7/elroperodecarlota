import type { Metadata } from "next";

export const metadata: Metadata = { title: "Política de Privacidad" };

export default function PrivacidadPage() {
  return (
    <div className="pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl mb-8">Política de Privacidad</h1>
        <div className="prose prose-sm text-foreground/70 space-y-4 [&_h2]:font-serif [&_h2]:text-foreground [&_h2]:text-xl [&_h2]:mt-8 [&_h2]:mb-3">
          <p>Última actualización: abril 2026</p>

          <h2>1. Responsable del tratamiento</h2>
          <p>
            El Ropero de Carlota, con domicilio en Archena, Murcia, es responsable del
            tratamiento de los datos personales recogidos a través de esta web.
          </p>

          <h2>2. Datos que recogemos</h2>
          <p>Recogemos los siguientes datos personales cuando realizas una compra:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Nombre y apellidos</li>
            <li>Dirección de email</li>
            <li>Número de teléfono</li>
            <li>Dirección de envío</li>
          </ul>

          <h2>3. Finalidad del tratamiento</h2>
          <p>Tus datos se utilizan para:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Gestionar y procesar tus pedidos</li>
            <li>Enviarte información sobre tu compra</li>
            <li>Cumplir con obligaciones legales</li>
          </ul>

          <h2>4. Base legal</h2>
          <p>
            La base legal para el tratamiento es la ejecución del contrato de compraventa
            y tu consentimiento expreso.
          </p>

          <h2>5. Destinatarios</h2>
          <p>
            Tus datos podrán ser compartidos con Stripe (procesador de pagos) y con
            empresas de transporte para la entrega de pedidos.
          </p>

          <h2>6. Derechos</h2>
          <p>
            Puedes ejercer tus derechos de acceso, rectificación, supresión, portabilidad
            y oposición contactando con nosotros en info@elroperodecarlota.es.
          </p>

          <h2>7. Comunicaciones comerciales</h2>
          <p>
            Solo enviaremos comunicaciones comerciales (novedades, ofertas) si has dado tu
            consentimiento expreso, ya sea al suscribirte a nuestra newsletter o al marcar
            la casilla correspondiente durante el proceso de compra.
          </p>
          <p>
            Este consentimiento es opcional y está separado de la compra: no es necesario
            suscribirse para realizar un pedido.
          </p>
          <p>
            Puedes darte de baja en cualquier momento haciendo clic en el enlace de baja
            incluido en cada email o contactándonos en info@elroperodecarlota.es.
          </p>
          <p>
            También ofrecemos un canal de WhatsApp al que puedes unirte voluntariamente.
            La suscripción a este canal es independiente y puedes abandonarlo cuando desees.
          </p>

          <h2>8. Conservación</h2>
          <p>
            Los datos se conservarán mientras sea necesario para la finalidad para la que
            fueron recogidos y durante los plazos legalmente establecidos.
          </p>
        </div>
      </div>
    </div>
  );
}
