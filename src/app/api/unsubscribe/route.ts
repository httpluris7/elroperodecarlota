import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/baja?ok=0", request.url));
  }

  try {
    await prisma.subscriber.update({
      where: { unsubscribeToken: token },
      data: { active: false },
    });

    return NextResponse.redirect(new URL("/baja?ok=1", request.url));
  } catch {
    return NextResponse.redirect(new URL("/baja?ok=0", request.url));
  }
}
