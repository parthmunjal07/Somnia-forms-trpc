import { env } from "~/env.js";
import { AuthGuard } from "~/components/AuthGuard";

/**
 * Server-side dashboard layout.
 * Fetches the CSRF token from the API and injects it as a meta tag
 * so client components can read it for mutating requests.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const apiBase = env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  let csrfToken = "";

  try {
    const response = await fetch(`${apiBase}/api/csrf`, {
      credentials: "include",
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as { csrfToken: string };
      csrfToken = data.csrfToken;
    }
  } catch {
    // non-fatal — CSRF will be refetched on first mutation
  }

  return (
    <>
      {/* Inject CSRF token as a meta tag for client-side reads */}
      <meta name="csrf-token" content={csrfToken} />
      <AuthGuard>{children}</AuthGuard>
    </>
  );
}
