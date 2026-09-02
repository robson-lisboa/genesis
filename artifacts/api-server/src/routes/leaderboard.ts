import { Router, type IRouter } from "express";
import { db, studentsTable } from "@workspace/db";
import { GetLeaderboardResponse } from "@workspace/api-zod";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.get("/leaderboard", async (req, res): Promise<void> => {
  const limit = typeof req.query.limit === "string" ? parseInt(req.query.limit, 10) : 20;
  const students = await db.select().from(studentsTable)
    .orderBy(desc(studentsTable.xp))
    .limit(Math.min(limit || 20, 100));

  const entries = students.map((s, idx) => ({
    rank: idx + 1,
    studentId: s.id,
    username: s.username,
    level: s.level,
    xp: s.xp,
    title: s.title,
    avatarUrl: s.avatarUrl ?? null,
    streak: s.streak,
  }));

  res.json(GetLeaderboardResponse.parse(entries));
});

export default router;
