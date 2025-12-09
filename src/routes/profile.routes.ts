import { Router } from "express";
import { getProfileController } from "../controllers/profile.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.get("/profile", authenticateToken, getProfileController);

export default router;

