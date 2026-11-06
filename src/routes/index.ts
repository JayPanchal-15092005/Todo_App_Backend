import { Hono } from "hono";
import { todosRouter } from "./todos.routes";
import { dailyRouter } from "./daily.routes";
import { statsRouter } from "./stats.routes";

export const apiRouter = new Hono();

apiRouter.route("/todos", todosRouter);
apiRouter.route("/daily", dailyRouter);
apiRouter.route("/stats", statsRouter);
