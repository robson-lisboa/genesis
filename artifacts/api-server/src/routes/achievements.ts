import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, achievementsTable, studentAchievementsTable } from "@workspace/db";
import { ListAchievementsResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_STUDENT_ID = 1;

router.get("/achievements", async (req, res): Promise<void> => {
  const achievements = await db.select().from(achievementsTable).orderBy(achievementsTable.id);
  const earned = await db.select().from(studentAchievementsTable)
    .where(eq(studentAchievementsTable.studentId, DEFAULT_STUDENT_ID));
  const earnedMap = new Map(earned.map(e => [e.achievementId, e.earnedAt]));

  const list = achievements.map(a => ({
    id: a.id,
    title: a.title,
    description: a.description,
    icon: a.icon,
    category: a.category,
    xpReward: a.xpReward,
    isEarned: earnedMap.has(a.id),
    rarity: a.rarity,
    earnedAt: earnedMap.get(a.id)?.toISOString() ?? null,
  }));

  res.json(ListAchievementsResponse.parse(list));
});

export default router;
