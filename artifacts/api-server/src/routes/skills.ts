import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, skillsTable, studentSkillsTable, studentsTable } from "@workspace/db";
import {
  GetSkillTreeResponse,
  UnlockSkillParams,
  UnlockSkillResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_STUDENT_ID = 1;

router.get("/skills", async (req, res): Promise<void> => {
  const skills = await db.select().from(skillsTable).orderBy(skillsTable.tier);
  const unlockedSkills = await db.select().from(studentSkillsTable)
    .where(eq(studentSkillsTable.studentId, DEFAULT_STUDENT_ID));
  const unlockedIds = new Set(unlockedSkills.map(s => s.skillId));

  const skillTree = skills.map(skill => ({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    xpCost: skill.xpCost,
    isUnlocked: unlockedIds.has(skill.id),
    prerequisites: Array.isArray(skill.prerequisites) ? skill.prerequisites as number[] : [],
    icon: skill.icon,
    tier: skill.tier,
  }));

  res.json(GetSkillTreeResponse.parse(skillTree));
});

router.post("/skills/:skillId/unlock", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.skillId) ? req.params.skillId[0] : req.params.skillId;
  const params = UnlockSkillParams.safeParse({ skillId: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const skill = await db.query.skillsTable.findFirst({
    where: eq(skillsTable.id, params.data.skillId),
  });
  if (!skill) {
    res.status(404).json({ error: "Skill not found" });
    return;
  }

  const student = await db.query.studentsTable.findFirst({
    where: eq(studentsTable.id, DEFAULT_STUDENT_ID),
  });
  if (!student || student.xp < skill.xpCost) {
    res.status(400).json({ error: "XP insuficiente para desbloquear esta habilidade." });
    return;
  }

  const already = await db.query.studentSkillsTable.findFirst({
    where: eq(studentSkillsTable.skillId, params.data.skillId),
  });

  if (!already) {
    await db.insert(studentSkillsTable).values({
      studentId: DEFAULT_STUDENT_ID,
      skillId: params.data.skillId,
    });
  }

  res.json(UnlockSkillResponse.parse({
    id: skill.id,
    name: skill.name,
    description: skill.description,
    category: skill.category,
    xpCost: skill.xpCost,
    isUnlocked: true,
    prerequisites: Array.isArray(skill.prerequisites) ? skill.prerequisites as number[] : [],
    icon: skill.icon,
    tier: skill.tier,
  }));
});

export default router;
