import { Hono } from "hono";
import { StatsController } from "../controllers/stats.controller";

export const statsRouter = new Hono();

statsRouter.get("/", StatsController.getStats);
