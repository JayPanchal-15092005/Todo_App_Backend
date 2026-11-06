import { defineConfig } from "drizzle-kit";

declare const process: {
  env: Record<string, string | undefined>;
};

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL || "",
  },
});
