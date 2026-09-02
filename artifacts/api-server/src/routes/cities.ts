import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, citiesTable, missionsTable, missionProgressTable } from "@workspace/db";
import {
  GetCityParams,
  GetCityResponse,
  ListCitiesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_STUDENT_ID = 1;

router.get("/cities", async (req, res): Promise<void> => {
  const cities = await db.select().from(citiesTable).orderBy(citiesTable.order);
  const missions = await db.select().from(missionsTable);
  const progress = await db.select().from(missionProgressTable)
    .where(eq(missionProgressTable.studentId, DEFAULT_STUDENT_ID));

  const completedMissionIds = new Set(
    progress.filter(p => p.isCompleted).map(p => p.missionId)
  );

  const cityList = cities.map((city, idx) => {
    const cityMissions = missions.filter(m => m.cityId === city.id);
    const completedCount = cityMissions.filter(m => completedMissionIds.has(m.id)).length;
    const isUnlocked = idx === 0 || completedCount > 0 ||
      cities.slice(0, idx).some(prev => {
        const prevMissions = missions.filter(m => m.cityId === prev.id);
        return prevMissions.length > 0 && prevMissions.every(m => completedMissionIds.has(m.id));
      });

    return {
      id: city.id,
      name: city.name,
      description: city.description,
      theme: city.theme,
      icon: city.icon,
      totalMissions: cityMissions.length,
      completedMissions: completedCount,
      isUnlocked: idx === 0 ? true : isUnlocked,
      xpReward: city.xpReward,
      difficulty: city.difficulty,
      position: { x: city.positionX, y: city.positionY },
    };
  });

  res.json(ListCitiesResponse.parse(cityList));
});

router.get("/cities/:cityId", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.cityId) ? req.params.cityId[0] : req.params.cityId;
  const params = GetCityParams.safeParse({ cityId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const city = await db.query.citiesTable.findFirst({
    where: eq(citiesTable.id, params.data.cityId),
  });

  if (!city) {
    res.status(404).json({ error: "City not found" });
    return;
  }

  const missions = await db.select().from(missionsTable)
    .where(eq(missionsTable.cityId, city.id))
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

  const bossProgress = progress.find(p => false);
  const isUnlocked = true;

  res.json(GetCityResponse.parse({
    id: city.id,
    name: city.name,
    description: city.description,
    theme: city.theme,
    icon: city.icon,
    totalMissions: missions.length,
    completedMissions: missionList.filter(m => m.isCompleted).length,
    isUnlocked,
    xpReward: city.xpReward,
    difficulty: city.difficulty,
    position: { x: city.positionX, y: city.positionY },
    missions: missionList,
    boss: {
      name: city.bossName,
      description: city.bossDescription,
      isDefeated: missionList.every(m => m.isCompleted),
    },
  }));
});

export default router;
