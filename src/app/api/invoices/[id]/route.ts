import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

interface RouteContext {
  params: Promise<{ id: string }>;
}


export async function GET(
 req: Request,
  context: RouteContext
) {
  const params = await context.params;
  if (!params.id) {
    return NextResponse.json({ error: "Invoice ID is required" }, { status: 400 })
  }
  try {
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id
      }
    })
    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 })
    }
    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error fetching invoice:", error)
    return NextResponse.json({ error: "Error fetching invoice" }, { status: 500 })
  }
}

export async function PATCH(
 request: Request,
  context: RouteContext
) {
    const params = await context.params;

  try {
    const data = await request.json()
    const invoice = await prisma.invoice.update({
      where: {
        id: params.id
      },
      data
    })
    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error updating invoice:", error)
    return NextResponse.json({ error: "Error updating invoice" }, { status: 500 })
  }
}

export async function DELETE(
 req: Request,
  context: RouteContext
) {
    const params = await context.params;

  try {
    await prisma.invoice.delete({
      where: {
        id: params.id
      }
    })
    return NextResponse.json({ message: "Invoice deleted" })
  } catch (error) {
    console.error("Error deleting invoice:", error)
    return NextResponse.json({ error: "Error deleting invoice" }, { status: 500 })
  }
}
