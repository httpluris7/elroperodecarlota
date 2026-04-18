import Link from "next/link";
import Image from "next/image";

interface CategoryCardProps {
  name: string;
  slug: string;
  image?: string | null;
}

export default function CategoryCard({ name, slug, image }: CategoryCardProps) {
  return (
    <Link
      href={`/tienda/${slug}`}
      className="category-cinematic group relative block aspect-[3/4] overflow-hidden"
    >
      {image ? (
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="category-img object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-sand to-sand-dark" />
      )}

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

      {/* Content */}
      <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 sm:pb-10">
        <div className="category-line h-px bg-gold mx-auto mb-4" />
        <h3 className="category-label font-serif text-lg sm:text-2xl text-white tracking-[0.15em] uppercase">
          {name}
        </h3>
        <p className="text-white/0 group-hover:text-white/60 text-xs tracking-wider mt-2 transition-all duration-500 translate-y-2 group-hover:translate-y-0">
          Explorar
        </p>
      </div>
    </Link>
  );
}
