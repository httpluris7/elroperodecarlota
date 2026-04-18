"use client";

import { useState, useEffect } from "react";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";

function CartImage({ src, alt }: { src: string; alt: string }) {
  const [error, setError] = useState(false);
  if (!src || error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-foreground/20">
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

export default function CartDrawer() {
  const { items, isOpen, closeCart, removeItem, updateQuantity, totalPrice } =
    useCart();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-50 transition-opacity"
        onClick={closeCart}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-background z-50 shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-sand/30">
          <h2 className="font-serif text-lg">Tu carrito</h2>
          <button
            onClick={closeCart}
            className="p-1 hover:text-gold transition-colors"
            aria-label="Cerrar carrito"
          >
            <X size={20} />
          </button>
        </div>

        {/* Items */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-foreground/50">
            <ShoppingBag size={48} strokeWidth={1} />
            <p>Tu carrito está vacío</p>
            <button
              onClick={closeCart}
              className="text-sm underline underline-offset-4 hover:text-gold transition-colors"
            >
              Seguir comprando
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex gap-4"
                >
                  <div className="relative w-20 h-24 bg-sand/20 rounded shrink-0 overflow-hidden">
                    <CartImage src={item.image} alt={item.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs text-foreground/50 mt-0.5">
                      {item.size && `Talla: ${item.size}`}
                      {item.size && item.color && " · "}
                      {item.color && `Color: ${item.color}`}
                    </p>
                    <p className="text-sm font-medium mt-1">
                      {formatPrice(item.price)}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(
                            item.productId,
                            item.size,
                            item.color,
                            item.quantity - 1
                          )
                        }
                        className="w-7 h-7 border border-foreground/20 rounded flex items-center justify-center hover:border-foreground transition-colors"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="text-sm w-6 text-center">
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
                        className="w-7 h-7 border border-foreground/20 rounded flex items-center justify-center hover:border-foreground transition-colors"
                      >
                        <Plus size={14} />
                      </button>
                      <button
                        onClick={() =>
                          removeItem(item.productId, item.size, item.color)
                        }
                        className="ml-auto text-xs text-foreground/40 hover:text-foreground transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-sand/30 p-6 space-y-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span className="font-medium">{formatPrice(totalPrice())}</span>
              </div>
              <p className="text-xs text-foreground/50">
                Gastos de envío calculados en el checkout
              </p>
              <Link
                href="/carrito"
                onClick={closeCart}
                className="block w-full bg-foreground text-background text-center py-3.5 text-sm tracking-wide uppercase hover:bg-foreground/90 transition-colors"
              >
                Ver carrito
              </Link>
              <Link
                href="/checkout"
                onClick={closeCart}
                className="block w-full bg-gold text-white text-center py-3.5 text-sm tracking-wide uppercase hover:bg-gold-dark transition-colors"
              >
                Finalizar compra
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
