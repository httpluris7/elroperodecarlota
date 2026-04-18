"use client";

import { useState } from "react";
import Link from "next/link";

type Status = "idle" | "loading" | "success" | "error";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [wantsEmail, setWantsEmail] = useState(true);
  const [wantsWhatsapp, setWantsWhatsapp] = useState(false);
  const [status, setStatus] = useState<Status>("idle");

  const whatsappUrl = process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          wantsEmail,
          wantsWhatsapp,
          source: "footer",
        }),
      });

      if (!res.ok) throw new Error();

      setStatus("success");
      setEmail("");

      // If user wants WhatsApp and we have a channel URL, open it
      if (wantsWhatsapp && whatsappUrl) {
        window.open(whatsappUrl, "_blank");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="text-center">
        <p className="text-background text-sm">
          &#10003; ¡Te has suscrito correctamente! Recibirás nuestras novedades.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto">
      <div className="flex gap-2">
        <input
          type="email"
          required
          placeholder="Tu email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-transparent border border-background/30 px-4 py-2.5 text-sm text-background placeholder:text-background/40 focus:outline-none focus:border-gold transition-colors"
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="bg-gold text-white px-6 py-2.5 text-sm tracking-wider uppercase hover:bg-gold-dark transition-colors disabled:opacity-50 shrink-0"
        >
          {status === "loading" ? "..." : "Suscribirse"}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-3">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-background/60">
          <input
            type="checkbox"
            checked={wantsEmail}
            onChange={(e) => setWantsEmail(e.target.checked)}
            className="accent-gold"
          />
          Novedades por email
        </label>
        {whatsappUrl && (
          <label className="flex items-center gap-2 cursor-pointer text-xs text-background/60">
            <input
              type="checkbox"
              checked={wantsWhatsapp}
              onChange={(e) => setWantsWhatsapp(e.target.checked)}
              className="accent-gold"
            />
            Canal de WhatsApp
          </label>
        )}
      </div>

      {status === "error" && (
        <p className="text-red-400 text-xs mt-2">Error al suscribirse. Inténtalo de nuevo.</p>
      )}

      <p className="text-[10px] text-background/40 mt-3">
        Al suscribirte aceptas nuestra{" "}
        <Link href="/legal/privacidad" className="underline hover:text-background/60 transition-colors">
          política de privacidad
        </Link>
        . Puedes darte de baja en cualquier momento.
      </p>
    </form>
  );
}
