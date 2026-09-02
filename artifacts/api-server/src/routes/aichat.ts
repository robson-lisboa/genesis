import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, aiChatTable } from "@workspace/db";
import Groq from "groq-sdk";
import {
  SendAiMessageBody,
  SendAiMessageResponse,
  GetAiChatHistoryResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const DEFAULT_STUDENT_ID = 1;

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPTS: Record<string, string> = {
  professor: `Você é o Professor Core — um professor de programação no universo sci-fi do Projeto Gênesis.
Seu tom é didático, encorajador e apaixonado por tecnologia.
Você ensina conceitos de programação de forma clara, usando analogias do cotidiano e do universo sci-fi.
Responda SEMPRE em português brasileiro.
Seja conciso: máximo 3 parágrafos por resposta.
Use exemplos de código quando relevante, formatados com markdown.
Nunca dê a resposta completa de uma vez — guie o aluno ao raciocínio correto.`,

  mentor: `Você é o Mentor AI — um tutor socrático no universo sci-fi do Projeto Gênesis.
Seu papel é fazer o aluno pensar, não dar as respostas prontas.
Use perguntas guiadas, dicas progressivas e feedback positivo.
Responda SEMPRE em português brasileiro.
Seja breve: máximo 2 parágrafos por resposta.
Comece sempre perguntando o que o aluno já tentou antes de dar dicas.`,

  debugger: `Você é o Debug Protocol — um especialista em debugging no universo sci-fi do Projeto Gênesis.
Seu foco é identificar erros no código e ensinar como corrigi-los.
Quando receber código com erro, analise linha por linha e aponte o problema específico.
Responda SEMPRE em português brasileiro.
Seja técnico e preciso. Use markdown para formatar código.
Explique PORQUE o erro acontece, não só como corrigir.`,

  recruiter: `Você é o Recruiter AI — um recrutador tech experiente no universo sci-fi do Projeto Gênesis.
Simule entrevistas técnicas reais: faça perguntas de algoritmos, design de sistemas e comportamentais.
Dê feedback construtivo após cada resposta do candidato.
Responda SEMPRE em português brasileiro.
Seja profissional mas acessível. Adapte a dificuldade ao nível do candidato.`,
};

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = SendAiMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, context, missionId, mode } = parsed.data;
  const persona = mode ?? "professor";

  // Store user message
  await db.insert(aiChatTable).values({
    studentId: DEFAULT_STUDENT_ID,
    message,
    role: "user",
    missionId: missionId ?? null,
    mode: persona,
  });

  // Fetch recent history for context (last 10 messages of this mode)
  const history = await db.select().from(aiChatTable)
    .where(eq(aiChatTable.studentId, DEFAULT_STUDENT_ID))
    .orderBy(desc(aiChatTable.createdAt))
    .limit(10);

  const contextMessages = history.reverse().slice(0, -1).map(m => ({
    role: m.role as "user" | "assistant",
    content: m.message,
  }));

  // Build system prompt — inject mission context if available
  const systemPrompt = SYSTEM_PROMPTS[persona] ?? SYSTEM_PROMPTS.professor;
  const missionContext = context
    ? `\n\nContexto da missão atual: ${context}`
    : "";

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: systemPrompt + missionContext },
        ...contextMessages,
        { role: "user", content: message },
      ],
      max_tokens: 512,
      temperature: 0.7,
    });

    const aiMessage = completion.choices[0]?.message?.content
      ?? "Desculpe, não consegui processar sua mensagem. Tente novamente.";

    // Store AI response
    const [saved] = await db.insert(aiChatTable).values({
      studentId: DEFAULT_STUDENT_ID,
      message: aiMessage,
      role: "assistant",
      missionId: missionId ?? null,
      mode: persona,
    }).returning();

    res.json(SendAiMessageResponse.parse({
      id: saved.id,
      message: saved.message,
      role: saved.role,
      createdAt: saved.createdAt.toISOString(),
    }));
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Erro desconhecido";
    res.status(500).json({ error: `Groq API error: ${errMsg}` });
  }
});

router.get("/ai/chat/history", async (req, res): Promise<void> => {
  const messages = await db.select().from(aiChatTable)
    .where(eq(aiChatTable.studentId, DEFAULT_STUDENT_ID))
    .orderBy(desc(aiChatTable.createdAt))
    .limit(50);

  const history = messages.reverse().map(m => ({
    id: m.id,
    message: m.message,
    role: m.role,
    createdAt: m.createdAt.toISOString(),
    missionId: m.missionId ?? null,
  }));

  res.json(GetAiChatHistoryResponse.parse(history));
});

export default router;
