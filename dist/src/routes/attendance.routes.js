"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("../controllers/attendance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// Mark attendance (with image upload support)
router.post("/mark", auth_middleware_1.authenticateToken, upload_middleware_1.uploadSingleImage, attendance_controller_1.markAttendanceController);
// Get user's attendance records (with optional date range)
router.get("/", auth_middleware_1.authenticateToken, attendance_controller_1.getUserAttendanceController);
// Get today's attendance
router.get("/today", auth_middleware_1.authenticateToken, attendance_controller_1.getTodayAttendanceController);
exports.default = router;
