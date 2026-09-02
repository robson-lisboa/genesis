import { Router, type IRouter } from "express";
import healthRouter from "./health";
import profileRouter from "./profile";
import citiesRouter from "./cities";
import missionsRouter from "./missions";
import skillsRouter from "./skills";
import achievementsRouter from "./achievements";
import leaderboardRouter from "./leaderboard";
import dashboardRouter from "./dashboard";
import dailyRouter from "./daily";
import aichatRouter from "./aichat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(profileRouter);
router.use(citiesRouter);
router.use(missionsRouter);
router.use(skillsRouter);
router.use(achievementsRouter);
router.use(leaderboardRouter);
router.use(dashboardRouter);
router.use(dailyRouter);
router.use(aichatRouter);

export default router;
