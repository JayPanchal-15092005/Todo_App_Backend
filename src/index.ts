import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiRouter } from "./routes";

declare const process: {
  env: Record<string, string | undefined>;
};

export const app = new Hono();

// Middlewares
app.use("*", logger());
app.use(
  "*",
  cors({
    origin: "*",
    allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  })
);

// Global error handler
app.onError((err, c) => {
  console.error("Server Error:", err);
  return c.json(
    {
      success: false,
      error: err.message || "Internal Server Error",
    },
    500
  );
});

// Health check handler
const healthCheck = (c: any) => {
  const hasDb = Boolean(process.env.DATABASE_URL);
  return c.json({
    status: "online",
    framework: "Hono",
    orm: "Drizzle ORM",
    database: hasDb ? "Neon Serverless Postgres" : "MISSING DATABASE_URL in Vercel settings",
    endpoints: {
      todos: "/api/todos",
      daily: "/api/daily",
      stats: "/api/stats",
    },
  });
};

app.get("/", healthCheck);
app.get("/api", healthCheck);

// Mount master API router
app.route("/api", apiRouter);

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
