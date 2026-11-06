import { asc, desc, eq, sql } from "drizzle-orm";
import { Request, Response } from "express";
import { dailyTasks, db } from "../db";

export class DailyController {
  static async getDailyTasks(_req: Request, res: Response): Promise<void> {
    try {
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

      res.json({ success: true, data: tasks });
    } catch (error: any) {
      console.error("Error fetching daily tasks:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async createDailyTask(req: Request, res: Response): Promise<void> {
    try {
      const { title, category = "Habit", frequency = "daily" } = req.body;

      if (!title || String(title).trim() === "") {
        res.status(400).json({ success: false, error: "Title is required" });
        return;
      }

      const [task] = await db
        .insert(dailyTasks)
        .values({
          title: String(title).trim(),
          category,
          frequency,
          streak: 0,
          last_completed_date: null,
        })
        .returning();

      res.status(201).json({
        success: true,
        data: {
          ...task,
          is_completed_today: false,
        },
      });
    } catch (error: any) {
      console.error("Error creating daily task:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async toggleDailyTask(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);

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
        res.status(404).json({ success: false, error: "Daily task not found" });
        return;
      }

      let updated;
      const today = new Date().toISOString().slice(0, 10);

      if (task.is_completed_today) {
        // Unmark today
        const newStreak = Math.max(0, (task.streak || 1) - 1);
        const [result] = await db
          .update(dailyTasks)
          .set({
            last_completed_date: null,
            streak: newStreak,
          })
          .where(eq(dailyTasks.id, id))
          .returning();

        updated = { ...result, is_completed_today: false };
      } else {
        // Complete today
        const newStreak = task.was_yesterday ? (task.streak || 0) + 1 : 1;
        const [result] = await db
          .update(dailyTasks)
          .set({
            last_completed_date: today,
            streak: newStreak,
          })
          .where(eq(dailyTasks.id, id))
          .returning();

        updated = { ...result, is_completed_today: true };
      }

      res.json({ success: true, data: updated });
    } catch (error: any) {
      console.error("Error toggling daily task:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }

  static async deleteDailyTask(req: Request, res: Response): Promise<void> {
    try {
      const id = Number(req.params.id);
      const [deleted] = await db
        .delete(dailyTasks)
        .where(eq(dailyTasks.id, id))
        .returning({ id: dailyTasks.id });

      if (!deleted) {
        res.status(404).json({ success: false, error: "Daily task not found" });
        return;
      }

      res.json({ success: true, data: { id } });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
