import { Hono } from "hono";
import { DailyController } from "../controllers/daily.controller";

export const dailyRouter = new Hono();

dailyRouter.get("/", DailyController.getDailyTasks);
dailyRouter.post("/", DailyController.createDailyTask);
dailyRouter.patch("/:id/toggle", DailyController.toggleDailyTask);
dailyRouter.delete("/:id", DailyController.deleteDailyTask);
