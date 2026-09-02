import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, studentsTable } from "@workspace/db";
import {
  GetProfileResponse,
  UpdateProfileBody,
  UpdateProfileResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const DEFAULT_STUDENT_ID = 1;

router.get("/profile", async (req, res): Promise<void> => {
  let student = await db.query.studentsTable.findFirst({
    where: eq(studentsTable.id, DEFAULT_STUDENT_ID),
  });

  if (!student) {
    const [created] = await db.insert(studentsTable).values({
      username: "Herói Gênesis",
      level: 1,
      xp: 0,
      title: "Aprendiz",
      streak: 7,
      coins: 350,
    }).returning();
    student = created;
  }

  const xpToNextLevel = student.level * 1000;
  const rank = 42;

  res.json(GetProfileResponse.parse({
    ...student,
    xpToNextLevel,
    rank,
    avatarUrl: student.avatarUrl ?? null,
    bio: student.bio ?? null,
    createdAt: student.createdAt.toISOString(),
  }));
});

router.patch("/profile", async (req, res): Promise<void> => {
  const parsed = UpdateProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [updated] = await db.update(studentsTable)
    .set(parsed.data)
    .where(eq(studentsTable.id, DEFAULT_STUDENT_ID))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  const xpToNextLevel = updated.level * 1000;
  const rank = 42;

  res.json(UpdateProfileResponse.parse({
    ...updated,
    xpToNextLevel,
    rank,
    avatarUrl: updated.avatarUrl ?? null,
    bio: updated.bio ?? null,
    createdAt: updated.createdAt.toISOString(),
  }));
});

export default router;
