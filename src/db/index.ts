import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

declare const process: {
  env: Record<string, string | undefined>;
};

const connectionString = process.env.DATABASE_URL || "";

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL is not set in environment variables!");
}

export const client = connectionString
  ? postgres(connectionString, {
      ssl: "require",
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10,
    })
  : (null as any);

export const db = client ? drizzle(client, { schema }) : (null as any);
export * from "./schema";
