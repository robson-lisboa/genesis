import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, dailyChallengesTable, studentDailyChallengesTable } from "@workspace/db";
import { GetDailyChallengeResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_STUDENT_ID = 1;

router.get("/daily-challenge", async (req, res): Promise<void> => {
  const today = new Date().toISOString().split("T")[0];

  let challenge = await db.query.dailyChallengesTable.findFirst({
    where: eq(dailyChallengesTable.challengeDate, today),
  });

  if (!challenge) {
    // Create today's challenge
    const [created] = await db.insert(dailyChallengesTable).values({
      title: "Sequência de Fibonacci",
      description: "Implemente a sequência de Fibonacci e retorne o n-ésimo número.",
      xpReward: 250,
      coinReward: 75,
      difficulty: "Médio",
      language: "python",
      starterCode: "def fibonacci(n):\n    # Seu código aqui\n    pass\n\nprint(fibonacci(10))",
      instructions: "Escreva uma função `fibonacci(n)` que retorne o n-ésimo número da sequência de Fibonacci. A sequência começa com 0, 1, 1, 2, 3, 5, 8...\n\n**Exemplos:**\n- `fibonacci(0)` → `0`\n- `fibonacci(1)` → `1`\n- `fibonacci(10)` → `55`",
      challengeDate: today,
    }).returning();
    challenge = created;
  }

  const completed = await db.query.studentDailyChallengesTable.findFirst({
    where: eq(studentDailyChallengesTable.studentId, DEFAULT_STUDENT_ID),
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  res.json(GetDailyChallengeResponse.parse({
    id: challenge.id,
    title: challenge.title,
    description: challenge.description,
    xpReward: challenge.xpReward,
    coinReward: challenge.coinReward,
    isCompleted: !!completed,
    expiresAt: tomorrow.toISOString(),
    difficulty: challenge.difficulty,
    language: challenge.language,
    starterCode: challenge.starterCode,
    instructions: challenge.instructions,
  }));
});

export default router;
