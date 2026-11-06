import { dailyTasks, db } from "../db";
import { asc, desc, eq, sql } from "drizzle-orm";
import { Context } from "hono";

export class DailyController {
  static async getDailyTasks(c: Context) {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const tasks = await db
        .select({
          id: dailyTasks.id,
          title: dailyTasks.title,
          category: dailyTasks.category,
          frequency: dailyTasks.frequency,
          streak: dailyTasks.streak,
          last_completed_date: dailyTasks.last_completed_date,
          created_at: dailyTasks.created_at,
          is_completed_today: sql<boolean>`(${dailyTasks.last_completed_date} = CURRENT_DATE)`,
        })
        .from(dailyTasks)
        .orderBy(
          sql`(${dailyTasks.last_completed_date} = CURRENT_DATE) ASC`,
          desc(dailyTasks.streak),
          asc(dailyTasks.id)
        );

      return c.json({ success: true, data: tasks });
    } catch (error: any) {
      console.error("Error fetching daily tasks with Drizzle:", error);
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  static async createDailyTask(c: Context) {
    try {
      const { title, category = "Habit", frequency = "daily" } = await c.req.json();

      if (!title || title.trim() === "") {
        return c.json({ success: false, error: "Title is required" }, 400);
      }

      const [task] = await db
        .insert(dailyTasks)
        .values({
          title: title.trim(),
          category,
          frequency,
          streak: 0,
          last_completed_date: null,
        })
        .returning();

      return c.json(
        {
          success: true,
          data: {
            ...task,
            is_completed_today: false,
          },
        },
        201
      );
    } catch (error: any) {
      console.error("Error creating daily task with Drizzle:", error);
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  static async toggleDailyTask(c: Context) {
    try {
      const id = Number(c.req.param("id"));

      const [task] = await db
        .select({
          id: dailyTasks.id,
          title: dailyTasks.title,
          category: dailyTasks.category,
          frequency: dailyTasks.frequency,
          streak: dailyTasks.streak,
          last_completed_date: dailyTasks.last_completed_date,
          created_at: dailyTasks.created_at,
          is_completed_today: sql<boolean>`(${dailyTasks.last_completed_date} = CURRENT_DATE)`,
          was_yesterday: sql<boolean>`(${dailyTasks.last_completed_date} = CURRENT_DATE - INTERVAL '1 day')`,
        })
        .from(dailyTasks)
        .where(eq(dailyTasks.id, id));

      if (!task) {
        return c.json({ success: false, error: "Daily task not found" }, 404);
      }

      let updated;
      const today = new Date().toISOString().slice(0, 10);

      if (task.is_completed_today) {
        // Unmark today
        const newStreak = Math.max(0, (task.streak || 1) - 1);
        const [res] = await db
          .update(dailyTasks)
          .set({
            last_completed_date: null,
            streak: newStreak,
          })
          .where(eq(dailyTasks.id, id))
          .returning();

        updated = { ...res, is_completed_today: false };
      } else {
        // Complete today
        const newStreak = task.was_yesterday ? (task.streak || 0) + 1 : 1;
        const [res] = await db
          .update(dailyTasks)
          .set({
            last_completed_date: today,
            streak: newStreak,
          })
          .where(eq(dailyTasks.id, id))
          .returning();

        updated = { ...res, is_completed_today: true };
      }

      return c.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error toggling daily task with Drizzle:", error);
      return c.json({ success: false, error: error.message }, 500);
    }
  }

  static async deleteDailyTask(c: Context) {
    try {
      const id = Number(c.req.param("id"));
      const [deleted] = await db
        .delete(dailyTasks)
        .where(eq(dailyTasks.id, id))
        .returning({ id: dailyTasks.id });

      if (!deleted) {
        return c.json({ success: false, error: "Daily task not found" }, 404);
      }

      return c.json({ success: true, data: { id } });
    } catch (error: any) {
      return c.json({ success: false, error: error.message }, 500);
    }
  }
}
