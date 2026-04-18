import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { safeJsonParse } from "@/lib/utils";

interface CheckoutItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  size: string;
  color: string;
  image: string;
}

interface CustomerData {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  province: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, customer, deliveryMethod, marketingConsent } = body as {
      items: CheckoutItem[];
      customer: CustomerData;
      deliveryMethod?: "shipping" | "pickup";
      marketingConsent?: boolean;
    };

    const isPickup = deliveryMethod === "pickup";

    if (!items?.length || !customer?.email || !customer?.name || !customer?.phone) {
      return NextResponse.json(
        { error: "Datos incompletos" },
        { status: 400 }
      );
    }

    if (!isPickup && (!customer.address || !customer.city || !customer.postalCode || !customer.province)) {
      return NextResponse.json(
        { error: "Dirección de envío requerida" },
        { status: 400 }
      );
    }

    // Verify prices and stock against database
    const productIds = items.map((i) => i.productId);
    const dbProducts = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
    });
    const productMap = new Map(dbProducts.map((p) => [p.id, p]));

    const verifiedItems = items.map((item) => {
      const dbProduct = productMap.get(item.productId);
      if (!dbProduct) {
        throw new Error(`Producto ${item.productId} no encontrado o no disponible`);
      }

      // Validate stock per size
      if (item.size) {
        const stock = safeJsonParse<Record<string, number>>(dbProduct.stock, {});
        const available = stock[item.size] ?? 0;
        if (available < item.quantity) {
          throw new Error(
            `Sin stock suficiente para "${dbProduct.name}" talla ${item.size} (disponible: ${available})`
          );
        }
      }

      return { ...item, price: dbProduct.price };
    });

    const total = verifiedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order in DB (pending status)
    const order = await prisma.order.create({
      data: {
        status: "pending",
        customerName: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: isPickup
          ? JSON.stringify({ pickup: true })
          : JSON.stringify({
              street: customer.address,
              city: customer.city,
              postalCode: customer.postalCode,
              province: customer.province,
            }),
        deliveryMethod: isPickup ? "pickup" : "shipping",
        total,
        items: {
          create: verifiedItems.map((item) => ({
            productId: item.productId,
            productName: item.name,
            quantity: item.quantity,
            size: item.size || "",
            color: item.color || "",
            price: item.price,
          })),
        },
      },
    });

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: customer.email,
      metadata: {
        orderId: order.id.toString(),
        deliveryMethod: isPickup ? "pickup" : "shipping",
        marketingConsent: marketingConsent ? "true" : "false",
        customerEmail: customer.email,
        customerName: customer.name,
      },
      line_items: verifiedItems.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: {
            name: item.name,
            description: [item.size && `Talla: ${item.size}`, item.color && `Color: ${item.color}`]
              .filter(Boolean)
              .join(" · ") || undefined,
          },
          unit_amount: Math.round(item.price * 100),
        },
        quantity: item.quantity,
      })),
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/pedido/confirmacion?session_id={CHECKOUT_SESSION_ID}${isPickup ? "&pickup=1" : ""}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/carrito`,
    });

    // Update order with Stripe session ID
    await prisma.order.update({
      where: { id: order.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    const message = error instanceof Error ? error.message : "Error al crear la sesión de pago";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
