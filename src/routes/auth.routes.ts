import { Router } from "express";
import { loginController, registerController } from "../controllers/auth.controller";
import { getProfileController } from "../controllers/profile.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

router.post("/register", registerController);
router.post("/login", loginController);
router.get("/profile", authenticateToken, getProfileController);

export default router;
