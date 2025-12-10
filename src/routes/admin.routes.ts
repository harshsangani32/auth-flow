import { Router } from "express";
import { addUserController, deleteUserController, getAdminProfileController, getUserCountController, registerAdminController, requestAdminOTPController, updateUserController, verifyAdminOTPAndLoginController } from "../controllers/admin.controller";
import { authenticateToken } from "../middleware/auth.middleware";

const router = Router();

// Simple admin metric: total registered users
router.get("/users/count", getUserCountController);
router.post("/register", registerAdminController);

// Admin OTP login flow
router.post("/request-otp", requestAdminOTPController);
router.post("/verify-otp-login", verifyAdminOTPAndLoginController);

// Admin profile (protected route)
router.get("/profile", authenticateToken, getAdminProfileController);

// User management (protected routes)
router.post("/users", authenticateToken, addUserController);
router.put("/users/:id", authenticateToken, updateUserController);
router.delete("/users/:id", authenticateToken, deleteUserController);

export default router;

