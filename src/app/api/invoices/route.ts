import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: {
        createdAt: "desc"
      }
    })
    return NextResponse.json(invoices)
  } catch (error) {
    console.error("Error fetching invoices:", error)
    return NextResponse.json({ error: "Error fetching invoices" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    const invoice = await prisma.invoice.create({
      data: {
        ...data,
        invoiceNo: `INV-${Date.now()}`,
        isGstRegistered: data.type === "BUSINESS",
        companyName: data.type === "BUSINESS" ? data.companyName : null,
        gstin: data.type === "BUSINESS" ? data.gstin : null,
        cgst: data.state === "West Bengal" ? data.cgst : 0,
        sgst: data.state === "West Bengal" ? data.sgst : 0,
        igst: data.state !== "West Bengal" ? data.igst : 0,
        type: data.type,
        status: data.status
      }
    })
    return NextResponse.json(invoice)
  } catch (error) {
    console.error("Error creating invoice:", error)
    return NextResponse.json({ error: "Error creating invoice" }, { status: 500 })
  }
}
