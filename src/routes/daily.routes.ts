import { Router } from "express";
import { DailyController } from "../controllers/daily.controller";

export const dailyRouter = Router();

dailyRouter.get("/", DailyController.getDailyTasks);
dailyRouter.post("/", DailyController.createDailyTask);
dailyRouter.patch("/:id/toggle", DailyController.toggleDailyTask);
dailyRouter.delete("/:id", DailyController.deleteDailyTask);
