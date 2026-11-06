import { Router } from "express";
import { dailyRouter } from "./daily.routes";
import { statsRouter } from "./stats.routes";
import { todosRouter } from "./todos.routes";

export const apiRouter = Router();

apiRouter.use("/todos", todosRouter);
apiRouter.use("/daily", dailyRouter);
apiRouter.use("/stats", statsRouter);
