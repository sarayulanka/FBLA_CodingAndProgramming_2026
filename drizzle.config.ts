import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

const isRemote = connectionString.startsWith("libsql://") || connectionString.startsWith("https://");

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: "turso",
  dbCredentials: {
    url: isRemote ? connectionString : (connectionString.startsWith("file:") ? connectionString : `file:${connectionString}`),
    authToken: isRemote ? process.env.DATABASE_AUTH_TOKEN : undefined,
  },
});
