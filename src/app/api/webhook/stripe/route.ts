import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";
import { sendOrderConfirmation } from "@/lib/email";
import crypto from "crypto";
import Stripe from "stripe";

async function notifyTelegram(order: {
  id: number;
  customerName: string;
  email: string;
  total: number;
  deliveryMethod: string;
  address: string;
  items: { productName: string; quantity: number; size: string; price: number }[];
}) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!botToken || !chatId) return;

  const itemsList = order.items
    .map((i) => `  • ${i.productName} x${i.quantity}${i.size ? ` (${i.size})` : ""} — ${i.price.toFixed(2)}€`)
    .join("\n");

  const isPickup = order.deliveryMethod === "pickup";
  let deliveryLine: string;
  if (isPickup) {
    deliveryLine = "🏪 Recogida en tienda";
  } else {
    const addr = safeJsonParse<{ street?: string; city?: string; postalCode?: string; province?: string }>(order.address, {});
    deliveryLine = `📦 Envío a: ${addr.street || ""}, ${addr.postalCode || ""} ${addr.city || ""}, ${addr.province || ""}`;
  }

  const message =
    `🛍️ *Nuevo pedido #${order.id}*\n\n` +
    `👤 ${order.customerName}\n` +
    `📧 ${order.email}\n` +
    `${deliveryLine}\n\n` +
    `📦 Productos:\n${itemsList}\n\n` +
    `💰 *Total: ${order.total.toFixed(2)}€*`;

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch (e) {
    console.error("Telegram notification error:", e);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET not configured");
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = parseInt(session.metadata?.orderId || "0");

    if (orderId) {
      // Idempotency: only update if order is still pending
      const existing = await prisma.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      });

      if (existing && existing.status === "pending") {
        const deliveryMethod = session.metadata?.deliveryMethod || "shipping";

        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "paid",
            stripeSessionId: session.id,
            deliveryMethod,
          },
          include: { items: true },
        });

        // Decrement stock per size for each item
        for (const item of order.items) {
          if (item.productId && item.size) {
            const product = await prisma.product.findUnique({
              where: { id: item.productId },
              select: { stock: true, stockTotal: true },
            });
            if (product) {
              const stock = safeJsonParse<Record<string, number>>(product.stock, {});
              stock[item.size] = Math.max(0, (stock[item.size] ?? 0) - item.quantity);
              const stockTotal = Object.values(stock).reduce((sum, v) => sum + v, 0);
              await prisma.product.update({
                where: { id: item.productId },
                data: { stock: JSON.stringify(stock), stockTotal },
              });
            }
          }
        }

        // Send order confirmation email
        await sendOrderConfirmation(order);

        // Create subscriber if marketing consent given
        if (session.metadata?.marketingConsent === "true") {
          try {
            await prisma.subscriber.upsert({
              where: { email: order.email.toLowerCase().trim() },
              update: {
                name: order.customerName,
                phone: order.phone,
                active: true,
                consentAt: new Date(),
                consentSource: "checkout",
              },
              create: {
                email: order.email.toLowerCase().trim(),
                name: order.customerName,
                phone: order.phone,
                consentSource: "checkout",
                unsubscribeToken: crypto.randomUUID(),
              },
            });
          } catch (e) {
            console.error("Subscriber creation error:", e);
          }
        }

        await notifyTelegram(order);
      }
    }
  }

  return NextResponse.json({ received: true });
}
