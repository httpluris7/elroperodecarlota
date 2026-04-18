import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const id = searchParams.get("id");
  const status = searchParams.get("status");
  const rawLimit = parseInt(searchParams.get("limit") || "10");
  const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 10 : rawLimit), 100);

  if (id) {
    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }
    const order = await prisma.order.findUnique({
      where: { id: parsedId },
      include: { items: true },
    });
    if (!order) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }
    return NextResponse.json(order);
  }

  const where: Record<string, unknown> = {};
  const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
  if (status && validStatuses.includes(status)) {
    where.status = status;
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: true },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return NextResponse.json(orders);
}

export async function PUT(request: NextRequest) {
  try {
    const { id, status } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 });
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "ID inv��lido" }, { status: 400 });
    }

    const validStatuses = ["pending", "paid", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Estado inválido" }, { status: 400 });
    }

    const existing = await prisma.order.findUnique({ where: { id: parsedId } });
    if (!existing) {
      return NextResponse.json({ error: "Pedido no encontrado" }, { status: 404 });
    }

    const order = await prisma.order.update({
      where: { id: parsedId },
      data: { status },
      include: { items: true },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Error al actualizar pedido" }, { status: 500 });
  }
}
