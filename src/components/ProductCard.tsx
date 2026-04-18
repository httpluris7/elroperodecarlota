import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/utils";
import { ArrowUpRight } from "lucide-react";

interface ProductCardProps {
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number | null;
  image: string;
  secondImage?: string;
  category?: string;
}

export default function ProductCard({
  name,
  slug,
  price,
  compareAtPrice,
  image,
  secondImage,
  category,
}: ProductCardProps) {
  return (
    <Link href={`/producto/${slug}`} className="group block hover-lift">
      <div className="relative aspect-[3/4] bg-sand/20 overflow-hidden mb-4">
        {/* Primary image */}
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-all duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-sand/40 to-sand/20" />
        )}

        {/* Second image on hover */}
        {secondImage && (
          <Image
            src={secondImage}
            alt={`${name} - vista 2`}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}

        {/* Sale badge */}
        {compareAtPrice && compareAtPrice > price && (
          <span className="absolute top-3 left-3 bg-foreground text-background text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 font-medium">
            -{Math.round(((compareAtPrice - price) / compareAtPrice) * 100)}%
          </span>
        )}

        {/* Quick view overlay */}
        <div className="product-card-overlay absolute inset-0 bg-black/10 flex items-end justify-center pb-6">
          <span className="bg-white text-foreground text-xs tracking-[0.15em] uppercase px-6 py-2.5 flex items-center gap-1.5 font-medium backdrop-blur-sm">
            Ver producto
            <ArrowUpRight size={13} />
          </span>
        </div>
      </div>

      {category && (
        <p className="text-[10px] tracking-[0.2em] uppercase text-gold mb-1.5 font-medium">
          {category}
        </p>
      )}
      <h3 className="text-sm group-hover:text-gold transition-colors duration-300">
        {name}
      </h3>
      <div className="flex items-center gap-2.5 mt-1.5">
        <span className="text-sm font-medium">{formatPrice(price)}</span>
        {compareAtPrice && compareAtPrice > price && (
          <span className="text-xs text-foreground/35 line-through">
            {formatPrice(compareAtPrice)}
          </span>
        )}
      </div>
    </Link>
  );
}
