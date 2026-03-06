import { Router } from "express";
import { AdminController } from "../controllers/admin.controller";
import { protect, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// All routes require authentication and admin role
router.use(protect);
router.use(requireAdmin);

// Users
router.get("/users", AdminController.getAllUsers);
router.put("/users/:userId/status", AdminController.updateUserStatus);
router.put("/users/:userId", AdminController.updateUser);
router.delete("/users/:userId", AdminController.deleteUser);

// Strategies
router.get("/strategies", AdminController.getAllStrategies);
router.put("/strategies/:strategyId/toggle", AdminController.toggleStrategy);

// Strategy Templates
router.post("/strategy-templates", AdminController.createStrategyTemplate);
router.get("/strategy-templates", AdminController.getStrategyTemplates);
router.get("/strategy-templates/:id", AdminController.getStrategyTemplateDetails);
router.put("/strategy-templates/:id", AdminController.updateStrategyTemplate);
router.delete("/strategy-templates/:id", AdminController.deleteStrategyTemplate);
router.post("/strategy-templates/:id/clone", AdminController.cloneStrategyTemplate);
router.put(
    "/strategy-templates/:id/indicators/:indicator/visibility",
    AdminController.toggleIndicatorParameterVisibility
);
router.put(
    "/strategy-template/:strategyId/visibility",
    AdminController.toggleStrategyVisibility
);

// Instruments
router.get("/instruments", AdminController.getAllInstruments);
router.get("/instruments/search", AdminController.searchInstruments);
router.get("/instruments/stats", AdminController.getInstrumentStats);
router.get("/instruments/:instrumentId", AdminController.getInstrumentDetails);
router.post("/instruments/update-all", AdminController.updateAllInstruments);

// Dashboard
router.get("/stats", AdminController.getDashboardStats);

// Trades
router.get("/trades", AdminController.getAllTrades);

export default router;
