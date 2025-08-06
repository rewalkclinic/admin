import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInvoicePDF, InvoiceItem } from "@/lib/generatePDFNew";
// Use InvoiceItem type from generatePDFNew
import { InvoiceStatus } from "@prisma/client";

interface RouteContext {
  params: Promise<{ id: string }>;
}



// Remove local InvoiceItem type, use the one from generatePDFNew

interface InvoiceWithDetails {
  id: string;
  invoiceNo: string;
  patientName: string | null;
  email: string | null;
  phone: string | null;
  isGstRegistered: boolean;
  companyName: string | null;
  gstin: string | null;
  addressLine1: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  items: InvoiceItem[];
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  status: InvoiceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export async function GET(
  req: Request,
  context: RouteContext
) {
  try {
    const params = await context.params;
    if (!params.id) {
      return new NextResponse("Invoice ID is required", { status: 400 });
    }

    // Fetch invoice with all details
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: params.id,
      },
      select: {
        id: true,
        invoiceNo: true,
        patientName: true,
        email: true,
        phone: true,
        isGstRegistered: true,
        companyName: true,
        gstin: true,
        addressLine1: true,
        city: true,
        state: true,
        pincode: true,
        items: true,
        subtotal: true,
        cgst: true,
        sgst: true,
        igst: true,
        total: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      }
    }) as InvoiceWithDetails | null;

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 });
    }

    try {


      // Since items is stored as JSON in the database, Prisma automatically parses it

      const invoiceWithItems = {
        ...invoice,
        items: Array.isArray(invoice.items) ? invoice.items : [invoice.items],
        companyName: invoice.companyName ?? undefined,
        gstin: invoice.gstin ?? undefined,
        email: invoice.email ?? undefined,
        phone: invoice.phone ?? undefined,
        addressLine1: invoice.addressLine1 ?? undefined,
        city: invoice.city ?? undefined,
        state: invoice.state ?? undefined,
        pincode: invoice.pincode ?? undefined,
        status: invoice.status as 'PENDING' | 'PAID'
      };

      const pdfBytes = await generateInvoicePDF(invoiceWithItems);

      // Convert Buffer to Uint8Array for the response
      const uint8Array = new Uint8Array(pdfBytes);

      // Set response headers for PDF download
      const headers = new Headers();
      headers.set("Content-Type", "application/pdf");
      headers.set(
        "Content-Disposition",
        `attachment; filename=${invoice.invoiceNo}.pdf`
      );

      return new NextResponse(uint8Array, {
        headers,
      });
    } catch (jsonError) {
      console.error("Error parsing invoice items:", jsonError);
      return new NextResponse("Invalid invoice data format", { status: 400 });
    }
  } catch (error) {
    console.error("Error generating PDF:", error);
    const errorMessage = error instanceof Error ? error.message : "Error generating PDF";
    return new NextResponse(errorMessage, { status: 500 });
  }
}
