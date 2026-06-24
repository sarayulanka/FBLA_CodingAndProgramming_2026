/**
 * trpc.ts — Typed tRPC React hooks.
 *
 * Creates a fully type-safe tRPC client bound to the server's AppRouter.
 * Every `trpc.<route>.<procedure>.useQuery()` / `.useMutation()` call
 * automatically infers input and output types end-to-end.
 */

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../../../server/routers";

export const trpc = createTRPCReact<AppRouter>();
