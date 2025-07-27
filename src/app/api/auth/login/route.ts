import { NextResponse } from "next/server";
import { signIn } from "@/auth";

export async function POST(request: Request) {
  try {
    const formData = await request.json();
    const { email, password } = formData;

    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (!result || result.error) {
      return NextResponse.json(
        { 
          message: "Invalid credentials", 
          success: false,
          error: result?.error 
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { message: "Login successful", success: true },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { 
        message: "Authentication failed", 
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}