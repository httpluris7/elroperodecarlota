import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendNewsletterBatch } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subject, content, botSecret } = body as {
      subject?: string;
      content?: string;
      botSecret?: string;
    };

    if (botSecret !== process.env.BOT_NEWSLETTER_SECRET) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (!subject || !content) {
      return NextResponse.json({ error: "Asunto y contenido requeridos" }, { status: 400 });
    }

    const subscribers = await prisma.subscriber.findMany({
      where: { active: true, wantsEmail: true },
      select: { email: true, unsubscribeToken: true },
    });

    const result = await sendNewsletterBatch(subscribers, subject, content);

    return NextResponse.json({
      sent: result.sent,
      failed: result.failed,
      total: subscribers.length,
    });
  } catch (error) {
    console.error("Newsletter send error:", error);
    return NextResponse.json({ error: "Error al enviar newsletter" }, { status: 500 });
  }
}
