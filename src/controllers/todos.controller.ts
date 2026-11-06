import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { db, todos } from "../db";

export class TodosController {
  static async getTodos(req: Request, res: Response): Promise<void> {
    try {
      const filter = (req.query.filter as string) || "all";
      const category = req.query.category as string | undefined;
      const priority = req.query.priority as string | undefined;
      const search = req.query.search as string | undefined;

      const conditions = [];

      if (filter === "pending") {
        conditions.push(eq(todos.is_completed, false));
      } else if (filter === "completed") {
        conditions.push(eq(todos.is_completed, true));
      } else if (filter === "today") {
        const today = new Date().toISOString().slice(0, 10);
        conditions.push(eq(todos.due_date, today));
      }

      if (category && category !== "All") {
        conditions.push(eq(todos.category, category));
      }

      if (priority && priority !== "All") {
        conditions.push(eq(todos.priority, priority));
      }

      if (search && search.trim() !== "") {
        const searchPattern = `%${search.trim()}%`;
        conditions.push(
          or(
            ilike(todos.title, searchPattern),
            ilike(todos.notes, searchPattern)
          )
        );
      }

      const results = await db
        .select()
        .from(todos)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(
          asc(todos.is_completed),
          sql`CASE 
            WHEN ${todos.priority} = 'high' THEN 1 
            WHEN ${todos.priority} = 'medium' THEN 2 
            WHEN ${todos.priority} = 'low' THEN 3 
            ELSE 4 
          END ASC`,
          sql`${todos.due_date} ASC NULLS LAST`,
          desc(todos.created_at)
        );

      res.json({ success: true, data: results });
    } catch (error: any) {
      console.error("Error fetching todos:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async getTodoById(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const [todo] = await db.select().from(todos).where(eq(todos.id, id));

      if (!todo) {
        res.status(404).json({ success: false, error: "Todo not found" });
        return;
      }

      res.json({ success: true, data: todo });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createTodo(req: Request, res: Response): Promise<void> {
    try {
      const {
        title,
        notes,
        priority = "medium",
        category = "Personal",
        dueDate,
        dueTime,
        reminderEnabled = false,
      } = req.body;

      if (!title || String(title).trim() === "") {
        res.status(400).json({ success: false, error: "Title is required" });
        return;
      }

      const [newTodo] = await db
        .insert(todos)
        .values({
          title: String(title).trim(),
          notes: notes ? String(notes).trim() : null,
          priority,
          category,
          due_date: dueDate || null,
          due_time: dueTime || null,
          reminder_enabled: Boolean(reminderEnabled),
          is_completed: false,
        })
        .returning();

      res.status(201).json({ success: true, data: newTodo });
    } catch (error: any) {
      console.error("Error creating todo:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async toggleTodo(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

      const [todo] = await db.select().from(todos).where(eq(todos.id, id));
      if (!todo) {
        res.status(404).json({ success: false, error: "Todo not found" });
        return;
      }

      const newCompleted = !todo.is_completed;
      const completedAt = newCompleted ? new Date() : null;

      const [updated] = await db
        .update(todos)
        .set({
          is_completed: newCompleted,
          completed_at: completedAt,
          updated_at: new Date(),
        })
        .where(eq(todos.id, id))
        .returning();

      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error toggling todo:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async updateTodo(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const { title, notes, priority, category, dueDate, dueTime, reminderEnabled } = req.body;

      const updateData: Partial<typeof todos.$inferInsert> = {
        updated_at: new Date(),
      };

      if (title !== undefined) updateData.title = String(title).trim();
      if (notes !== undefined) updateData.notes = notes ? String(notes).trim() : null;
      if (priority !== undefined) updateData.priority = priority;
      if (category !== undefined) updateData.category = category;
      if (dueDate !== undefined) updateData.due_date = dueDate;
      if (dueTime !== undefined) updateData.due_time = dueTime;
      if (reminderEnabled !== undefined) updateData.reminder_enabled = reminderEnabled;

      const [updated] = await db
        .update(todos)
        .set(updateData)
        .where(eq(todos.id, id))
        .returning();

      if (!updated) {
        res.status(404).json({ success: false, error: "Todo not found" });
        return;
      }

      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating todo:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async deleteTodo(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const [deleted] = await db.delete(todos).where(eq(todos.id, id)).returning({ id: todos.id });

      if (!deleted) {
        res.status(404).json({ success: false, error: "Todo not found" });
        return;
      }

      res.json({ success: true, data: { id } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async clearCompleted(req: Request, res: Response): Promise<void> {
    try {
      const deleted = await db
        .delete(todos)
        .where(eq(todos.is_completed, true))
        .returning({ id: todos.id });

      res.json({ success: true, count: deleted.length });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
