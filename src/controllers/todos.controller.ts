import { db, todos } from "../db";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { Context } from "hono";

export class TodosController {
  static async getTodos(c: Context) {
    try {
      const filter = c.req.query("filter") || "all";
      const category = c.req.query("category");
      const priority = c.req.query("priority");
      const search = c.req.query("search");

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

      return c.json({ success: true, data: results });
    } catch (error: any) {
      console.error("Error fetching todos with Drizzle:", error);
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  static async getTodoById(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      const [todo] = await db.select().from(todos).where(eq(todos.id, id));

      if (!todo) {
        return c.json({ success: false, error: "Todo not found" }, 404);
      }

      return c.json({ success: true, data: todo });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  static async createTodo(c: Context) {
    try {
      const body = await c.req.json();
      const {
        title,
        notes,
        priority = "medium",
        category = "Personal",
        dueDate,
        dueTime,
        reminderEnabled = false,
      } = body;

      if (!title || title.trim() === "") {
        return c.json({ success: false, error: "Title is required" }, 400);
      }

      const [newTodo] = await db
        .insert(todos)
        .values({
          title: title.trim(),
          notes: notes ? notes.trim() : null,
          priority,
          category,
          due_date: dueDate || null,
          due_time: dueTime || null,
          reminder_enabled: Boolean(reminderEnabled),
          is_completed: false,
        })
        .returning();

      return c.json({ success: true, data: newTodo }, 201);
    } catch (error: any) {
      console.error("Error creating todo with Drizzle:", error);
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  static async toggleTodo(c: Context) {
    try {
      const id = Number(c.req.param("id"));

      const [todo] = await db.select().from(todos).where(eq(todos.id, id));
      if (!todo) {
        return c.json({ success: false, error: "Todo not found" }, 404);
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

      return c.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error toggling todo with Drizzle:", error);
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  static async updateTodo(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      const body = await c.req.json();
      const { title, notes, priority, category, dueDate, dueTime, reminderEnabled } = body;

      const updateData: Partial<typeof todos.$inferInsert> = {
        updated_at: new Date(),
      };

      if (title !== undefined) updateData.title = title.trim();
      if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;
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
        return c.json({ success: false, error: "Todo not found" }, 404);
      }

      return c.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error updating todo with Drizzle:", error);
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  static async deleteTodo(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      const [deleted] = await db.delete(todos).where(eq(todos.id, id)).returning({ id: todos.id });

      if (!deleted) {
        return c.json({ success: false, error: "Todo not found" }, 404);
      }

      return c.json({ success: true, data: { id } });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  static async clearCompleted(c: Context) {
    try {
      const deleted = await db
        .delete(todos)
        .where(eq(todos.is_completed, true))
        .returning({ id: todos.id });

      return c.json({ success: true, count: deleted.length });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
}
