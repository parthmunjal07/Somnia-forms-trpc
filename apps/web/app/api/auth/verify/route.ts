import { NextResponse } from "next/server";
import { env } from "~/env.js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/login?error=Missing+verification+token", request.url));
  }

  try {
    const res = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/auth/verify-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token }),
    });

    if (!res.ok) {
      let errorMessage = "Verification failed";
      try {
        const data = await res.json();
        if (data.error) errorMessage = data.error;
        else if (data.message) errorMessage = data.message;
      } catch (e) {
        // Ignored
      }
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(errorMessage)}`, request.url));
    }

    return NextResponse.redirect(new URL("/login?verified=true", request.url));
  } catch (err) {
    console.error("Error during email verification:", err);
    return NextResponse.redirect(new URL("/login?error=Server+error", request.url));
  }
}
