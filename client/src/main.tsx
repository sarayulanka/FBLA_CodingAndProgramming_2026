/**
 * main.tsx — Application entry point.
 *
 * Bootstraps the React app by:
 *  1. Creating a tRPC client (with batched HTTP requests via superjson)
 *  2. Wiring up React Query for server-state caching
 *  3. Subscribing to query/mutation errors to auto-redirect on 401
 *  4. Rendering the root <App /> component into the DOM
 */

import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { getLoginUrl } from "./const";
import "./index.css";

// Global React Query client — manages caching, refetching, and deduplication
const queryClient = new QueryClient();

/**
 * Checks if an API error is an "unauthenticated" response.
 * If so, redirects the browser to the OAuth login page.
 */
const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  window.location.href = getLoginUrl();
};

// Subscribe to every query error — auto-redirect on auth failures
queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

// Subscribe to every mutation error — auto-redirect on auth failures
queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

// Create the tRPC client with batched HTTP transport and superjson serialization
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson, // Enables Date, Map, Set, etc. over JSON
      fetch(input, init) {
        // Always send cookies so the server can identify the session
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

// Mount the React tree into the #root element
createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </trpc.Provider>
);
