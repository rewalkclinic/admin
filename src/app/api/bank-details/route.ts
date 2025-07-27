import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bankDetails = await prisma.bankDetails.findFirst();
    
    if (!bankDetails) {
      return new NextResponse("Bank details not found", { status: 404 });
    }

    return NextResponse.json(bankDetails);
  } catch (error) {
    console.error("Error fetching bank details:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
} 