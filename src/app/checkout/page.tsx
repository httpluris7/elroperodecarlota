"use client";

import { useState } from "react";
import { useCart } from "@/hooks/use-cart";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ShoppingBag, Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const { items, totalPrice } = useCart();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    province: "",
    deliveryMethod: "shipping" as "shipping" | "pickup",
    marketingConsent: false,
  });

  if (items.length === 0) {
    return (
      <div className="pt-24 pb-16 text-center">
        <div className="max-w-lg mx-auto px-4">
          <ShoppingBag size={48} className="mx-auto mb-4 text-foreground/20" strokeWidth={1} />
          <h1 className="font-serif text-2xl mb-2">Tu carrito está vacío</h1>
          <Link
            href="/tienda"
            className="inline-flex items-center gap-2 bg-foreground text-background px-8 py-3.5 text-sm tracking-wider uppercase hover:bg-foreground/90 transition-colors mt-4"
          >
            Ir a la tienda
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            size: i.size,
            color: i.color,
            image: i.image,
          })),
          customer: form,
          deliveryMethod: form.deliveryMethod,
          marketingConsent: form.marketingConsent,
        }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Error al procesar el pago. Inténtalo de nuevo.");
        setLoading(false);
      }
    } catch {
      alert("Error al procesar el pago. Inténtalo de nuevo.");
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="font-serif text-3xl mb-10">Checkout</h1>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-10">
          {/* Form */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h2 className="font-serif text-lg mb-4">Datos de contacto</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="name" className="text-sm text-foreground/60 block mb-1">
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="w-full border border-foreground/20 px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors bg-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="text-sm text-foreground/60 block mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="w-full border border-foreground/20 px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors bg-transparent"
                  />
                </div>
                <div>
                  <label htmlFor="phone" className="text-sm text-foreground/60 block mb-1">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    className="w-full border border-foreground/20 px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors bg-transparent"
                  />
                </div>
              </div>
            </div>

            <div>
              <h2 className="font-serif text-lg mb-4">Método de entrega</h2>
              <div className="space-y-3">
                <label className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${form.deliveryMethod === "shipping" ? "border-foreground bg-sand/5" : "border-foreground/20"}`}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="shipping"
                    checked={form.deliveryMethod === "shipping"}
                    onChange={() => setForm({ ...form, deliveryMethod: "shipping" })}
                    className="accent-foreground"
                  />
                  <div>
                    <span className="text-sm font-medium">Envío a domicilio</span>
                    <p className="text-xs text-foreground/50 mt-0.5">Recibe tu pedido en la dirección indicada</p>
                  </div>
                </label>
                <label className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${form.deliveryMethod === "pickup" ? "border-foreground bg-sand/5" : "border-foreground/20"}`}>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={form.deliveryMethod === "pickup"}
                    onChange={() => setForm({ ...form, deliveryMethod: "pickup" })}
                    className="accent-foreground"
                  />
                  <div>
                    <span className="text-sm font-medium">Recogida en tienda</span>
                    <p className="text-xs text-foreground/50 mt-0.5">Archena, Murcia — te avisaremos cuando esté listo</p>
                  </div>
                </label>
              </div>
            </div>

            {form.deliveryMethod === "shipping" && (
              <div>
                <h2 className="font-serif text-lg mb-4">Dirección de envío</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="address" className="text-sm text-foreground/60 block mb-1">
                      Dirección *
                    </label>
                    <input
                      type="text"
                      id="address"
                      name="address"
                      required
                      value={form.address}
                      onChange={handleChange}
                      className="w-full border border-foreground/20 px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors bg-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="city" className="text-sm text-foreground/60 block mb-1">
                      Ciudad *
                    </label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      required
                      value={form.city}
                      onChange={handleChange}
                      className="w-full border border-foreground/20 px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors bg-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="postalCode" className="text-sm text-foreground/60 block mb-1">
                      Código postal *
                    </label>
                    <input
                      type="text"
                      id="postalCode"
                      name="postalCode"
                      required
                      value={form.postalCode}
                      onChange={handleChange}
                      className="w-full border border-foreground/20 px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors bg-transparent"
                    />
                  </div>
                  <div>
                    <label htmlFor="province" className="text-sm text-foreground/60 block mb-1">
                      Provincia *
                    </label>
                    <input
                      type="text"
                      id="province"
                      name="province"
                      required
                      value={form.province}
                      onChange={handleChange}
                      className="w-full border border-foreground/20 px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors bg-transparent"
                    />
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.marketingConsent}
                  onChange={(e) => setForm({ ...form, marketingConsent: e.target.checked })}
                  className="accent-foreground mt-0.5"
                />
                <span className="text-sm text-foreground/60">
                  Quiero recibir novedades y ofertas por email.{" "}
                  <Link href="/legal/privacidad" className="underline hover:text-foreground transition-colors">
                    Política de privacidad
                  </Link>
                </span>
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-sand/10 p-6 h-fit">
            <h2 className="font-serif text-lg mb-4">Tu pedido</h2>
            <div className="space-y-3 pb-4 border-b border-sand/30">
              {items.map((item) => (
                <div
                  key={`${item.productId}-${item.size}-${item.color}`}
                  className="flex justify-between text-sm"
                >
                  <span className="text-foreground/60">
                    {item.name} x{item.quantity}
                    {item.size && ` (${item.size})`}
                  </span>
                  <span>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm font-medium py-4 border-b border-sand/30">
              <span>Total</span>
              <span className="text-lg">{formatPrice(totalPrice())}</span>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-4 w-full bg-gold text-white py-3.5 text-sm tracking-wider uppercase hover:bg-gold-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Procesando...
                </>
              ) : (
                "Pagar con Stripe"
              )}
            </button>
            <p className="text-[10px] text-foreground/40 text-center mt-3">
              Serás redirigido a Stripe para completar el pago de forma segura.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
