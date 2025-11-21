import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { sdk } from "./sdk";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  // Demo mode for localhost: auto-login as demo user
  const isDemoMode = process.env.NODE_ENV === 'development' && !process.env.OAUTH_SERVER_URL;
  
  if (isDemoMode) {
    // Create a fake demo user for localhost testing
    user = {
      id: 1,
      openId: 'demo-user-localhost',
      name: 'Demo User',
      email: 'demo@localhost.com',
      loginMethod: 'demo',
      role: 'admin' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
  } else {
    try {
      user = await sdk.authenticateRequest(opts.req);
    } catch (error) {
      // Authentication is optional for public procedures.
      user = null;
    }
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
