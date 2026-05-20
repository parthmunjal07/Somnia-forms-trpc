import { httpLink, httpBatchStreamLink } from "@repo/trpc/client";
import { env } from "~/env.js";

interface CreateTRPCHttpBatchClientClientOpts {
  enableStreaming?: boolean;
}

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
}

export const createTRPCHttpBatchClientClient = (opts?: CreateTRPCHttpBatchClientClientOpts) => {
  const c = opts?.enableStreaming ? httpBatchStreamLink : httpLink;
  const baseUrl = getBaseUrl();
  const url = baseUrl ? `${baseUrl}/trpc` : "/trpc";
  return c({
    url,
    fetch(url, options) {
      return fetch(url, {
        ...options,
        credentials: "include",
      });
    },
  });
};
