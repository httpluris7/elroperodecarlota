"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { Suspense } from "react";

function ConfirmacionContent() {
  const { clearCart } = useCart();
  const params = useSearchParams();
  const pickup = params.get("pickup") === "1";

  useEffect(() => {
    clearCart();
  }, [clearCart]);

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4 text-center">
        <CheckCircle size={64} className="mx-auto mb-6 text-green-600" strokeWidth={1} />
        <h1 className="font-serif text-3xl mb-4">¡Pedido confirmado!</h1>
        <p className="text-foreground/60 leading-relaxed mb-2">
          Gracias por tu compra. Hemos recibido tu pedido y lo estamos preparando.
        </p>
        {pickup ? (
          <p className="text-foreground/60 leading-relaxed mb-2">
            Puedes recoger tu pedido en nuestra tienda de <strong className="text-foreground">Archena, Murcia</strong>. Te avisaremos cuando esté listo.
          </p>
        ) : (
          <p className="text-foreground/60 leading-relaxed mb-2">
            Tu pedido será enviado a la dirección indicada. Te avisaremos cuando se envíe.
          </p>
        )}
        <p className="text-foreground/60 leading-relaxed mb-8">
          Recibirás un email con los detalles de tu pedido.
        </p>
        <Link
          href="/tienda"
          className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
        >
          Seguir comprando
        </Link>
      </div>
    </div>
  );
}

export default function ConfirmacionPage() {
  return (
    <Suspense fallback={<div className="pt-24 pb-16 text-center">Cargando...</div>}>
      <ConfirmacionContent />
    </Suspense>
  );
}
