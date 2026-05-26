import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import superjson from "superjson";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // use relative URL on client
  return env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

/** Read csrf_token cookie (not httpOnly, so JS can access it). SSR-safe. */
function getCsrfCookie(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]!) : null;
}

/** Lazily fetch a fresh CSRF token from the server if the cookie is absent. */
async function ensureCsrfToken(): Promise<string> {
  const existing = getCsrfCookie();
  if (existing) return existing;

  // GET /api/csrf — server sets the csrf_token cookie and returns the token in JSON.
  const res = await fetch(`${getBaseUrl()}/api/csrf`, { credentials: "include" });
  const data = (await res.json()) as { csrfToken: string };
  return data.csrfToken;
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  const url = `${getBaseUrl()}/trpc`;
  return c({
    url,
    transformer: superjson,
    async fetch(url, options) {
      // Attach the CSRF token so the double-submit cookie check passes on every mutation.
      const csrf = await ensureCsrfToken();

      // options.headers can be a Headers instance, a plain object, or undefined.
      // Spreading a Headers instance with { ...headers } produces an empty object and
      // silently drops all headers (including Content-Type), causing 400 on the server.
      // Use Object.fromEntries() to safely convert any format to a plain object.
      const existingHeaders: Record<string, string> =
        options?.headers instanceof Headers
          ? Object.fromEntries((options.headers as Headers).entries())
          : (options?.headers as Record<string, string> | undefined) ?? {};

      return fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          ...existingHeaders,
          "x-csrf-token": csrf,
        },
      });
    },
  });
};
