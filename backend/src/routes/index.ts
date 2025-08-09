import { Router } from "express";
import authRoutes from "./auth";
import usersRoutes from "./users";
import recipesRoutes from "./recipes";
import salesRoutes from "./sales";
import expensesRoutes from "./expenses";
import inventoryRoutes from "./inventory";
import reportsRoutes from "./reports";
import settingsRoutes from "./settings";
import notificationsRoutes from "./notifications";
import auditLogsRoutes from "./auditLogs";
import dashboardRoutes from "./dashboard";

const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/recipes", recipesRoutes);
router.use("/sales", salesRoutes);
router.use("/expenses", expensesRoutes);
router.use("/inventory", inventoryRoutes);
router.use("/reports", reportsRoutes);
router.use("/settings", settingsRoutes);
router.use("/notifications", notificationsRoutes);
router.use("/audit-logs", auditLogsRoutes);
router.use("/dashboard", dashboardRoutes);

export default router;

