import { sql } from "drizzle-orm";
import { Request, Response } from "express";
import { dailyTasks, db, todos } from "../db";

export class StatsController {
  static async getStats(_req: Request, res: Response): Promise<void> {
    try {
      const today = new Date().toISOString().slice(0, 10);

      const [todoStats] = await db
        .select({
          total: sql<number>`COUNT(*)::int`,
          pending: sql<number>`COUNT(CASE WHEN ${todos.is_completed} = false THEN 1 END)::int`,
          completed: sql<number>`COUNT(CASE WHEN ${todos.is_completed} = true THEN 1 END)::int`,
          completedToday: sql<number>`COUNT(CASE WHEN ${todos.is_completed} = true AND DATE(${todos.completed_at}) = CURRENT_DATE THEN 1 END)::int`,
          highPriority: sql<number>`COUNT(CASE WHEN ${todos.is_completed} = false AND ${todos.priority} = 'high' THEN 1 END)::int`,
          dueToday: sql<number>`COUNT(CASE WHEN ${todos.is_completed} = false AND ${todos.due_date} = ${today} THEN 1 END)::int`,
        })
        .from(todos);

      const [dailyStats] = await db
        .select({
          totalHabits: sql<number>`COUNT(*)::int`,
          completedHabits: sql<number>`COUNT(CASE WHEN ${dailyTasks.last_completed_date} = CURRENT_DATE THEN 1 END)::int`,
          maxStreak: sql<number>`COALESCE(MAX(${dailyTasks.streak}), 0)::int`,
        })
        .from(dailyTasks);

      const totalTodos = todoStats?.total || 0;
      const completedTodos = todoStats?.completed || 0;
      const todoCompletionRate = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;

      const totalHabits = dailyStats?.totalHabits || 0;
      const completedHabits = dailyStats?.completedHabits || 0;
      const habitCompletionRate = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;

      res.json({
        success: true,
        data: {
          totalTodos,
          pendingTodos: todoStats?.pending || 0,
          completedTodos,
          completedToday: todoStats?.completedToday || 0,
          highPriority: todoStats?.highPriority || 0,
          dueToday: todoStats?.dueToday || 0,
          todoCompletionRate,
          totalHabits,
          completedHabits,
          maxStreak: dailyStats?.maxStreak || 0,
          habitCompletionRate,
        },
      });
    } catch (error: any) {
      console.error("Error fetching stats:", error);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}
