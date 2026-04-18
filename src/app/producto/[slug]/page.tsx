"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ShoppingBag, Minus, Plus } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import { useParams } from "next/navigation";

interface Product {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  compareAtPrice: number | null;
  images: string[];
  sizes: string[];
  colors: string[];
  stock: Record<string, number>;
  stockTotal: number;
  category: { name: string; slug: string };
}

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setProduct(data);
        // Auto-select first in-stock size
        if (data.sizes?.length > 0) {
          const firstInStock = data.sizes.find((s: string) => (data.stock?.[s] ?? 0) > 0);
          setSelectedSize(firstInStock || data.sizes[0]);
        }
        if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-10">
            <div className="aspect-[3/4] bg-sand/20 animate-pulse" />
            <div className="space-y-4">
              <div className="h-4 w-24 bg-sand/20 animate-pulse" />
              <div className="h-8 w-64 bg-sand/20 animate-pulse" />
              <div className="h-6 w-20 bg-sand/20 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pt-24 pb-16 text-center">
        <h1 className="font-serif text-2xl mb-4">Producto no encontrado</h1>
        <Link href="/tienda" className="text-sm underline underline-offset-4 hover:text-gold">
          Volver a la tienda
        </Link>
      </div>
    );
  }

  const images = product.images;

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: images[0] || "",
      size: selectedSize,
      color: selectedColor,
      quantity,
      slug: product.slug,
    });
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="text-xs text-foreground/40 mb-8 flex items-center gap-2">
          <Link href="/" className="hover:text-foreground transition-colors">Inicio</Link>
          <span>/</span>
          <Link href="/tienda" className="hover:text-foreground transition-colors">Tienda</Link>
          <span>/</span>
          <Link
            href={`/tienda/${product.category.slug}`}
            className="hover:text-foreground transition-colors"
          >
            {product.category.name}
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-[3/4] bg-sand/20 overflow-hidden">
              {images.length > 0 ? (
                images[selectedImage].startsWith("/uploads") ? (
                  <img
                    src={images[selectedImage]}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image
                    src={images[selectedImage]}
                    alt={product.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                )
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground/10">
                  <ShoppingBag size={64} />
                </div>
              )}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() =>
                      setSelectedImage(
                        selectedImage === 0 ? images.length - 1 : selectedImage - 1
                      )
                    }
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                    aria-label="Imagen anterior"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() =>
                      setSelectedImage(
                        selectedImage === images.length - 1 ? 0 : selectedImage + 1
                      )
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/80 flex items-center justify-center hover:bg-white transition-colors"
                    aria-label="Siguiente imagen"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}
            </div>
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-16 h-20 overflow-hidden border-2 transition-colors ${
                      i === selectedImage ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    {img.startsWith("/uploads") ? (
                      <img
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      <Image
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        fill
                        className="object-cover"
                      />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div>
            <p className="text-xs tracking-wider uppercase text-foreground/40 mb-2">
              {product.category.name}
            </p>
            <h1 className="font-serif text-2xl sm:text-3xl mb-4">
              {product.name}
            </h1>

            <div className="flex items-center gap-3 mb-6">
              <span className="text-xl">{formatPrice(product.price)}</span>
              {product.compareAtPrice && product.compareAtPrice > product.price && (
                <span className="text-lg text-foreground/40 line-through">
                  {formatPrice(product.compareAtPrice)}
                </span>
              )}
            </div>

            <p className="text-foreground/60 leading-relaxed mb-8">
              {product.description}
            </p>

            {/* Sizes */}
            {product.sizes.length > 0 && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-3">Talla</p>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => {
                    const sizeStock = product.stock?.[size] ?? 0;
                    const outOfStock = sizeStock === 0;
                    return (
                      <button
                        key={size}
                        onClick={() => {
                          if (!outOfStock) {
                            setSelectedSize(size);
                            setQuantity(1);
                          }
                        }}
                        disabled={outOfStock}
                        className={`min-w-[3rem] h-10 px-3 text-sm border transition-colors relative ${
                          outOfStock
                            ? "border-foreground/10 text-foreground/25 cursor-not-allowed line-through"
                            : selectedSize === size
                            ? "border-foreground bg-foreground text-background"
                            : "border-foreground/20 hover:border-foreground"
                        }`}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                {selectedSize && (product.stock?.[selectedSize] ?? 0) > 0 && (product.stock?.[selectedSize] ?? 0) <= 3 && (
                  <p className="text-xs text-gold mt-2">
                    Quedan solo {product.stock[selectedSize]} unidades
                  </p>
                )}
              </div>
            )}

            {/* Colors */}
            {product.colors.length > 0 && (
              <div className="mb-8">
                <p className="text-sm font-medium mb-3">Color</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-4 h-10 text-sm border transition-colors ${
                        selectedColor === color
                          ? "border-foreground bg-foreground text-background"
                          : "border-foreground/20 hover:border-foreground"
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            {(() => {
              const maxStock = selectedSize ? (product.stock?.[selectedSize] ?? 0) : product.stockTotal;
              const isOutOfStock = maxStock === 0;
              return (
                <>
                  <div className="mb-8">
                    <p className="text-sm font-medium mb-3">Cantidad</p>
                    <div className="flex items-center border border-foreground/20 w-fit">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={isOutOfStock}
                        className="w-10 h-10 flex items-center justify-center hover:bg-sand/20 transition-colors disabled:opacity-30"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center text-sm">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                        disabled={isOutOfStock || quantity >= maxStock}
                        className="w-10 h-10 flex items-center justify-center hover:bg-sand/20 transition-colors disabled:opacity-30"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Add to cart */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isOutOfStock}
                    className="w-full bg-foreground text-background py-4 text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ShoppingBag size={18} />
                    {isOutOfStock ? "Agotado" : "Añadir al carrito"}
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
