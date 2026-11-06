import { Hono } from "hono";
import { TodosController } from "../controllers/todos.controller";

export const todosRouter = new Hono();

todosRouter.get("/", TodosController.getTodos);
todosRouter.post("/", TodosController.createTodo);
todosRouter.delete("/clear-completed", TodosController.clearCompleted);
todosRouter.get("/:id", TodosController.getTodoById);
todosRouter.put("/:id", TodosController.updateTodo);
todosRouter.patch("/:id/toggle", TodosController.toggleTodo);
todosRouter.delete("/:id", TodosController.deleteTodo);
