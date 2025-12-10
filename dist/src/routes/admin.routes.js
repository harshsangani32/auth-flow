"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const admin_controller_1 = require("../controllers/admin.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Simple admin metric: total registered users
router.get("/users/count", admin_controller_1.getUserCountController);
router.post("/register", admin_controller_1.registerAdminController);
// Admin OTP login flow
router.post("/request-otp", admin_controller_1.requestAdminOTPController);
router.post("/verify-otp-login", admin_controller_1.verifyAdminOTPAndLoginController);
// Admin profile (protected route)
router.get("/profile", auth_middleware_1.authenticateToken, admin_controller_1.getAdminProfileController);
// User management (protected routes)
router.post("/users", auth_middleware_1.authenticateToken, admin_controller_1.addUserController);
router.put("/users/:id", auth_middleware_1.authenticateToken, admin_controller_1.updateUserController);
router.delete("/users/:id", auth_middleware_1.authenticateToken, admin_controller_1.deleteUserController);
exports.default = router;
