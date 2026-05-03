import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import decisionsRouter from "./decisions";
import outcomesRouter from "./outcomes";
import alertsRouter from "./alerts";
import integrationsRouter from "./integrations";
import reportsRouter from "./reports";
import analyticsRouter from "./analytics";
import chatRouter from "./chat";
import syncRouter from "./sync";
import paymentsRouter from "./payments";
import jiraRouter from "./jira";
import publicRouter from "./public";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/decisions", decisionsRouter);
router.use("/outcomes", outcomesRouter);
router.use("/alerts", alertsRouter);
router.use("/integrations", integrationsRouter);
router.use("/reports", reportsRouter);
router.use("/analytics", analyticsRouter);
router.use("/chat", chatRouter);
router.use("/sync", syncRouter);
router.use("/payments", paymentsRouter);
router.use("/jira", jiraRouter);
router.use("/public", publicRouter);

export default router;
