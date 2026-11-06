import { Router } from "express";
import { StatsController } from "../controllers/stats.controller";

export const statsRouter = Router();

statsRouter.get("/", StatsController.getStats);
