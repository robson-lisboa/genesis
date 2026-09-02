import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, studentsTable, missionProgressTable, citiesTable, missionsTable, achievementsTable, studentAchievementsTable, skillsTable, studentSkillsTable, activityTable } from "@workspace/db";
import { GetDashboardStatsResponse, GetActivityFeedResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_STUDENT_ID = 1;

router.get("/dashboard/stats", async (req, res): Promise<void> => {
  const student = await db.query.studentsTable.findFirst({
    where: eq(studentsTable.id, DEFAULT_STUDENT_ID),
  });

  const allCities = await db.select().from(citiesTable);
  const allMissions = await db.select().from(missionsTable);
  const allAchievements = await db.select().from(achievementsTable);
  const allSkills = await db.select().from(skillsTable);

  const progress = await db.select().from(missionProgressTable)
    .where(eq(missionProgressTable.studentId, DEFAULT_STUDENT_ID));
  const completedMissionIds = new Set(progress.filter(p => p.isCompleted).map(p => p.missionId));

  const earnedAchievements = await db.select().from(studentAchievementsTable)
    .where(eq(studentAchievementsTable.studentId, DEFAULT_STUDENT_ID));

  const unlockedSkills = await db.select().from(studentSkillsTable)
    .where(eq(studentSkillsTable.studentId, DEFAULT_STUDENT_ID));

  // Calculate cities completed
  const citiesCompleted = allCities.filter(city => {
    const cityMissions = allMissions.filter(m => m.cityId === city.id);
    return cityMissions.length > 0 && cityMissions.every(m => completedMissionIds.has(m.id));
  }).length;

  // XP history (last 7 days simulated)
  const xpHistory = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date: date.toISOString().split("T")[0],
      xp: Math.floor(Math.random() * 300) + 50,
    };
  });

  // Category strengths
  const categoryStrengths = [
    { category: "Lógica", score: 78 },
    { category: "Arquitetura", score: 45 },
    { category: "POO", score: 62 },
    { category: "Banco de Dados", score: 35 },
    { category: "Git", score: 55 },
    { category: "Algoritmos", score: 70 },
  ];

  res.json(GetDashboardStatsResponse.parse({
    totalXp: student?.xp ?? 0,
    xpThisWeek: 850,
    citiesCompleted,
    totalCities: allCities.length,
    missionsCompleted: completedMissionIds.size,
    totalMissions: allMissions.length,
    currentStreak: student?.streak ?? 0,
    longestStreak: Math.max(student?.streak ?? 0, 14),
    achievementsEarned: earnedAchievements.length,
    totalAchievements: allAchievements.length,
    globalRank: 42,
    skillsUnlocked: unlockedSkills.length,
    hoursThisWeek: 8.5,
    accuracyRate: 0.73,
    xpHistory,
    categoryStrengths,
  }));
});

router.get("/dashboard/activity", async (req, res): Promise<void> => {
  const activities = await db.select().from(activityTable)
    .where(eq(activityTable.studentId, DEFAULT_STUDENT_ID))
    .orderBy(desc(activityTable.createdAt))
    .limit(20);

  const feed = activities.map(a => ({
    id: a.id,
    type: a.type,
    description: a.description,
    xpEarned: a.xpEarned,
    createdAt: a.createdAt.toISOString(),
    cityName: a.cityName ?? null,
    missionTitle: a.missionTitle ?? null,
  }));

  res.json(GetActivityFeedResponse.parse(feed));
});

export default router;
