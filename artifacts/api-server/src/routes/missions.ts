import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, missionsTable, studentsTable, missionProgressTable, activityTable, achievementsTable, studentAchievementsTable } from "@workspace/db";
import {
  ListCityMissionsParams,
  ListCityMissionsResponse,
  GetMissionParams,
  GetMissionResponse,
  SubmitMissionParams,
  SubmitMissionBody,
  SubmitMissionResponse,
  RequestMissionHintParams,
  RequestMissionHintBody,
  RequestMissionHintResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_STUDENT_ID = 1;

router.get("/cities/:cityId/missions", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.cityId) ? req.params.cityId[0] : req.params.cityId;
  const params = ListCityMissionsParams.safeParse({ cityId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const missions = await db.select().from(missionsTable)
    .where(eq(missionsTable.cityId, params.data.cityId))
    .orderBy(missionsTable.order);

  const progress = await db.select().from(missionProgressTable)
    .where(eq(missionProgressTable.studentId, DEFAULT_STUDENT_ID));
  const completedMissionIds = new Set(progress.filter(p => p.isCompleted).map(p => p.missionId));

  const missionList = missions.map((m, idx) => ({
    id: m.id,
    cityId: m.cityId,
    title: m.title,
    description: m.description,
    type: m.type,
    xpReward: m.xpReward,
    coinReward: m.coinReward,
    isCompleted: completedMissionIds.has(m.id),
    isUnlocked: idx === 0 || completedMissionIds.has(missions[idx - 1]?.id),
    order: m.order,
    difficulty: m.difficulty,
    estimatedMinutes: m.estimatedMinutes ?? null,
  }));

  res.json(ListCityMissionsResponse.parse(missionList));
});

router.get("/missions/:missionId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.missionId) ? req.params.missionId[0] : req.params.missionId;
  const params = GetMissionParams.safeParse({ missionId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const mission = await db.query.missionsTable.findFirst({
    where: eq(missionsTable.id, params.data.missionId),
  });

  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }

  const allMissions = await db.select().from(missionsTable)
    .where(eq(missionsTable.cityId, mission.cityId))
    .orderBy(missionsTable.order);
  const missionIndex = allMissions.findIndex(m => m.id === mission.id);

  const progress = await db.select().from(missionProgressTable)
    .where(eq(missionProgressTable.studentId, DEFAULT_STUDENT_ID));
  const completedMissionIds = new Set(progress.filter(p => p.isCompleted).map(p => p.missionId));

  const testCases = Array.isArray(mission.testCases) ? mission.testCases : [];
  const hints = Array.isArray(mission.hints) ? mission.hints : [];

  res.json(GetMissionResponse.parse({
    id: mission.id,
    cityId: mission.cityId,
    title: mission.title,
    description: mission.description,
    type: mission.type,
    xpReward: mission.xpReward,
    coinReward: mission.coinReward,
    isCompleted: completedMissionIds.has(mission.id),
    isUnlocked: missionIndex === 0 || completedMissionIds.has(allMissions[missionIndex - 1]?.id),
    order: mission.order,
    difficulty: mission.difficulty,
    estimatedMinutes: mission.estimatedMinutes ?? null,
    challenge: {
      instructions: mission.instructions,
      starterCode: mission.starterCode,
      language: mission.language,
      testCases: testCases as any[],
      hints: hints as string[],
    },
  }));
});

router.post("/missions/:missionId/submit", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.missionId) ? req.params.missionId[0] : req.params.missionId;
  const params = SubmitMissionParams.safeParse({ missionId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = SubmitMissionBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const mission = await db.query.missionsTable.findFirst({
    where: eq(missionsTable.id, params.data.missionId),
  });
  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }

  const code = body.data.code.trim();
  const testCases = Array.isArray(mission.testCases) ? mission.testCases as any[] : [];

  // Run code against test cases using Piston sandbox
  const { runCodeAgainstTests } = await import("../utils/codeRunner.js");
  const runResult = await runCodeAgainstTests(code, mission.language, testCases);

  const success = runResult.success;
  const testsPassed = runResult.testsPassed;
  const totalTests = runResult.totalTests;

  const xpEarned = success ? mission.xpReward : 0;
  const coinEarned = success ? mission.coinReward : 0;

  // Update progress
  const existing = await db.query.missionProgressTable.findFirst({
    where: and(
      eq(missionProgressTable.studentId, DEFAULT_STUDENT_ID),
      eq(missionProgressTable.missionId, mission.id)
    )
  });

  let leveledUp = false;
  let newLevel: number | null = null;
  let newAchievements: any[] = [];

  if (success && !existing?.isCompleted) {
    if (existing) {
      await db.update(missionProgressTable)
        .set({ isCompleted: true, completedAt: new Date() })
        .where(eq(missionProgressTable.id, existing.id));
    } else {
      await db.insert(missionProgressTable).values({
        studentId: DEFAULT_STUDENT_ID,
        missionId: mission.id,
        isCompleted: true,
        completedAt: new Date(),
      });
    }

    // Update student XP and coins
    const student = await db.query.studentsTable.findFirst({
      where: eq(studentsTable.id, DEFAULT_STUDENT_ID)
    });
    if (student) {
      const newXp = student.xp + xpEarned;
      const newLevelCalc = Math.floor(newXp / 1000) + 1;
      leveledUp = newLevelCalc > student.level;
      newLevel = leveledUp ? newLevelCalc : null;

      const titles = ["Aprendiz", "Estudante", "Desenvolvedor Jr", "Desenvolvedor", "Desenvolvedor Sr", "Tech Lead", "Arquiteto", "CTO"];
      const titleIdx = Math.min(newLevelCalc - 1, titles.length - 1);

      await db.update(studentsTable)
        .set({
          xp: newXp,
          level: newLevelCalc,
          coins: student.coins + coinEarned,
          title: titles[titleIdx],
        })
        .where(eq(studentsTable.id, DEFAULT_STUDENT_ID));

      // Log activity
      await db.insert(activityTable).values({
        studentId: DEFAULT_STUDENT_ID,
        type: "mission_completed",
        description: `Missão "${mission.title}" concluída com sucesso!`,
        xpEarned,
        missionTitle: mission.title,
      });
    }
  }

  const failedTests = runResult.testResults.filter(t => !t.passed);
  const feedback = success
    ? "Excelente trabalho! Todos os testes passaram. Sua lógica está correta."
    : failedTests.length > 0
      ? `${testsPassed}/${totalTests} testes passaram. Falha: esperado "${failedTests[0].expectedOutput}", obtido "${failedTests[0].actualOutput || failedTests[0].error || "sem saída"}".`
      : runResult.stderr
        ? `Erro de execução: ${runResult.stderr.slice(0, 300)}`
        : "Quase lá! Verifique sua lógica e tente novamente.";

  res.json(SubmitMissionResponse.parse({
    success,
    xpEarned,
    coinEarned,
    testsPassed,
    totalTests,
    feedback,
    newAchievements,
    leveledUp,
    newLevel,
  }));
});

router.post("/missions/:missionId/hint", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.missionId) ? req.params.missionId[0] : req.params.missionId;
  const params = RequestMissionHintParams.safeParse({ missionId: parseInt(rawId, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const body = RequestMissionHintBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }

  const mission = await db.query.missionsTable.findFirst({
    where: eq(missionsTable.id, params.data.missionId),
  });
  if (!mission) {
    res.status(404).json({ error: "Mission not found" });
    return;
  }

  const hints = Array.isArray(mission.hints) ? mission.hints as string[] : [
    "Pense no problema passo a passo.",
    "Considere quais estruturas de dados são adequadas aqui.",
    "Aqui está a solução completa: resolva o problema de forma clara e direta.",
  ];

  const currentLevel = body.data.currentHintLevel;
  const hintIndex = Math.min(currentLevel, hints.length - 1);
  const hint = hints[hintIndex] ?? "Tente analisar o problema de uma perspectiva diferente.";

  res.json(RequestMissionHintResponse.parse({
    hint,
    hintLevel: hintIndex + 1,
    hasMoreHints: hintIndex < hints.length - 1,
  }));
});

export default router;
