"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function BajaContent() {
  const params = useSearchParams();
  const ok = params.get("ok") === "1";

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-lg mx-auto px-4 text-center">
        {ok ? (
          <>
            <div className="text-4xl mb-6">&#10003;</div>
            <h1 className="font-serif text-3xl mb-4">Te has dado de baja</h1>
            <p className="text-foreground/60 leading-relaxed mb-8">
              Hemos eliminado tu email de nuestra lista de novedades.
              No recibirás más correos comerciales.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl mb-6">&#10007;</div>
            <h1 className="font-serif text-3xl mb-4">Enlace no válido</h1>
            <p className="text-foreground/60 leading-relaxed mb-8">
              El enlace de baja no es válido o ya ha sido utilizado.
              Si sigues recibiendo correos, contáctanos.
            </p>
          </>
        )}
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
        >
          Volver a la tienda
        </Link>
      </div>
    </div>
  );
}

export default function BajaPage() {
  return (
    <Suspense fallback={<div className="pt-24 pb-16 text-center">Cargando...</div>}>
      <BajaContent />
    </Suspense>
  );
}
