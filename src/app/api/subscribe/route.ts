import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, name, wantsEmail, wantsWhatsapp, source } = body as {
      email?: string;
      name?: string;
      wantsEmail?: boolean;
      wantsWhatsapp?: boolean;
      source?: string;
    };

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 });
    }

    const subscriber = await prisma.subscriber.upsert({
      where: { email: email.toLowerCase().trim() },
      update: {
        name: name || undefined,
        wantsEmail: wantsEmail ?? true,
        wantsWhatsapp: wantsWhatsapp ?? false,
        active: true,
        consentAt: new Date(),
        consentSource: source || "footer",
      },
      create: {
        email: email.toLowerCase().trim(),
        name: name || "",
        wantsEmail: wantsEmail ?? true,
        wantsWhatsapp: wantsWhatsapp ?? false,
        consentSource: source || "footer",
        unsubscribeToken: crypto.randomUUID(),
      },
    });

    return NextResponse.json({ ok: true, id: subscriber.id });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json({ error: "Error al suscribirse" }, { status: 500 });
  }
}
