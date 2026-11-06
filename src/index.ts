import cors from "cors";
import express, { Request, Response } from "express";
import { apiRouter } from "./routes";

declare const process: {
  env: Record<string, string | undefined>;
};

export const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Health check handler
const healthCheck = (_req: Request, res: Response) => {
  const hasDb = Boolean(process.env.DATABASE_URL);
  res.json({
    status: "online",
    framework: "Express.js (Node.js & Bun)",
    orm: "Drizzle ORM",
    database: hasDb ? "Neon Serverless Postgres" : "MISSING DATABASE_URL in environment",
    endpoints: {
      todos: "/api/todos",
      daily: "/api/daily",
      stats: "/api/stats",
    },
  });
};

app.get("/", healthCheck);
app.get("/api", healthCheck);

// Mount master API router (both /api and root / for seamless Vercel rewrites)
app.use("/api", apiRouter);
app.use("/", apiRouter);

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: any) => {
  console.error("Unhandled Error:", err);
  res.status(500).json({
    success: false,
    error: err.message || "Internal Server Error",
  });
});

// Start local server if running directly
const PORT = Number(process.env.PORT) || 3000;
if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

export default app;
