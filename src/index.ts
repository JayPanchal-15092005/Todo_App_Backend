import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { apiRouter } from "./routes";

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

// Health check endpoint
app.get("/", (c) => {
  return c.json({
    status: "online",
    framework: "Hono + Bun",
    orm: "Drizzle ORM",
    database: "Neon Serverless Postgres",
    endpoints: {
      todos: "/api/todos",
      daily: "/api/daily",
      stats: "/api/stats",
    },
  });
});

// Mount master API router
app.route("/api", apiRouter);

const port = Number(process.env.PORT) || 3000;
console.log(`Server is running on http://localhost:${port}`);

export default {
  port,
  fetch: app.fetch,
};
