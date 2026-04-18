import Link from "next/link";

export default function NotFound() {
  return (
    <div className="pt-24 pb-16 min-h-[60vh] flex items-center justify-center">
      <div className="text-center px-4">
        <p className="text-6xl font-serif text-sand mb-4">404</p>
        <h1 className="font-serif text-2xl mb-2">Página no encontrada</h1>
        <p className="text-foreground/50 text-sm mb-8">
          La página que buscas no existe o ha sido movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
