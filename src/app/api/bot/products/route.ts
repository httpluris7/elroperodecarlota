import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { slugify } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, categoryId, images, sizes, colors, featured } = body;

    if (!name || !price || !categoryId) {
      return NextResponse.json({ error: "Nombre, precio y categoría son obligatorios" }, { status: 400 });
    }

    const parsedPrice = parseFloat(price);
    const parsedCategoryId = parseInt(categoryId);

    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
    }
    if (isNaN(parsedCategoryId)) {
      return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
    }

    // Check category exists
    const category = await prisma.category.findUnique({ where: { id: parsedCategoryId } });
    if (!category) {
      return NextResponse.json({ error: "Categoría no encontrada" }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(name);
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const product = await prisma.product.create({
      data: {
        name,
        slug,
        description: description || "",
        price: parsedPrice,
        categoryId: parsedCategoryId,
        images: JSON.stringify(images || []),
        sizes: JSON.stringify(sizes || []),
        colors: JSON.stringify(colors || []),
        featured: featured || false,
      },
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error creating product:", error);
    return NextResponse.json({ error: "Error al crear producto" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 });
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    // Check product exists
    const existing = await prisma.product.findUnique({ where: { id: parsedId } });
    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    const updateData: Record<string, unknown> = {};
    if (data.name !== undefined) {
      updateData.name = data.name;
      let slug = slugify(data.name);
      const slugConflict = await prisma.product.findFirst({
        where: { slug, id: { not: parsedId } },
      });
      if (slugConflict) slug = `${slug}-${Date.now().toString(36)}`;
      updateData.slug = slug;
    }
    if (data.description !== undefined) updateData.description = data.description;
    if (data.price !== undefined) {
      const p = parseFloat(data.price);
      if (isNaN(p) || p <= 0) return NextResponse.json({ error: "Precio inválido" }, { status: 400 });
      updateData.price = p;
    }
    if (data.categoryId !== undefined) {
      const c = parseInt(data.categoryId);
      if (isNaN(c)) return NextResponse.json({ error: "Categoría inválida" }, { status: 400 });
      updateData.categoryId = c;
    }
    if (data.images !== undefined) updateData.images = JSON.stringify(data.images);
    if (data.sizes !== undefined) updateData.sizes = JSON.stringify(data.sizes);
    if (data.colors !== undefined) updateData.colors = JSON.stringify(data.colors);
    if (data.active !== undefined) updateData.active = data.active;
    if (data.featured !== undefined) updateData.featured = data.featured;
    if (data.compareAtPrice !== undefined) {
      const cp = parseFloat(data.compareAtPrice);
      updateData.compareAtPrice = isNaN(cp) ? null : cp;
    }

    const product = await prisma.product.update({
      where: { id: parsedId },
      data: updateData,
    });

    return NextResponse.json(product);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Error al actualizar producto" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: "ID obligatorio" }, { status: 400 });
    }

    const parsedId = parseInt(id);
    if (isNaN(parsedId)) {
      return NextResponse.json({ error: "ID inválido" }, { status: 400 });
    }

    const existing = await prisma.product.findUnique({ where: { id: parsedId } });
    if (!existing) {
      return NextResponse.json({ error: "Producto no encontrado" }, { status: 404 });
    }

    await prisma.product.delete({ where: { id: parsedId } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Error al eliminar producto" }, { status: 500 });
  }
}
