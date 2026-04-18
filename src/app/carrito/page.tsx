"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Minus, Plus, ShoppingBag, Trash2, ArrowLeft } from "lucide-react";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";

function CartImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-foreground/10">
        <ShoppingBag size={24} />
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      className="object-cover"
      onError={() => setError(true)}
    />
  );
}

export default function CarritoPage() {
  const { items, removeItem, updateQuantity, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-16 text-center">
        <div className="max-w-lg mx-auto px-4">
          <ShoppingBag size={48} className="mx-auto mb-4 text-foreground/20" strokeWidth={1} />
          <h1 className="font-serif text-2xl mb-2">Tu carrito está vacío</h1>
          <p className="text-foreground/50 text-sm mb-6">
            Aún no has añadido ningún producto.
          </p>
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
          >
            Ir a la tienda
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl mb-10">Tu carrito</h1>

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Items */}
          <div className="lg:col-span-2 space-y-6">
            {items.map((item) => (
              <div
                key={`${item.productId}-${item.size}-${item.color}`}
                className="flex gap-4 pb-6 border-b border-sand/30"
              >
                <div className="relative w-24 h-32 bg-sand/20 shrink-0 overflow-hidden">
                  <CartImage src={item.image} alt={item.name} />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <div>
                      <Link
                        href={`/producto/${item.slug}`}
                        className="text-sm font-medium hover:text-gold transition-colors"
                      >
                        {item.name}
                      </Link>
                      <p className="text-xs text-foreground/50 mt-0.5">
                        {item.size && `Talla: ${item.size}`}
                        {item.size && item.color && " · "}
                        {item.color && `Color: ${item.color}`}
                      </p>
                    </div>
                    <p className="text-sm font-medium">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex items-center border border-foreground/20">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.size,
                            item.color,
                            item.quantity - 1
                          )
                        }
                        className="w-8 h-8 flex items-center justify-center hover:bg-sand/20 transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.size,
                            item.color,
                            item.quantity + 1
                          )
                        }
                        className="w-8 h-8 flex items-center justify-center hover:bg-sand/20 transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() =>
                        removeItem(item.productId, item.size, item.color)
                      }
                      className="text-foreground/30 hover:text-foreground transition-colors"
                      aria-label="Eliminar"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <Link
              href="/tienda"
              className="inline-flex items-center gap-1 text-sm text-foreground/50 hover:text-foreground transition-colors"
            >
              <ArrowLeft size={14} />
              Seguir comprando
            </Link>
          </div>

          {/* Summary */}
          <div className="bg-sand/10 p-6 h-fit">
            <h2 className="font-serif text-lg mb-4">Resumen</h2>
            <div className="space-y-2 text-sm pb-4 border-b border-sand/30">
              <div className="flex justify-between">
                <span className="text-foreground/60">Subtotal</span>
                <span>{formatPrice(totalPrice())}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Envío</span>
                <span className="text-foreground/40">Calculado en checkout</span>
              </div>
            </div>
            <div className="flex justify-between text-sm font-medium py-4">
              <span>Total</span>
              <span className="text-lg">{formatPrice(totalPrice())}</span>
            </div>
            <Link
              href="/checkout"
              className="block w-full bg-foreground text-background text-center py-3.5 text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors"
            >
              Finalizar compra
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
