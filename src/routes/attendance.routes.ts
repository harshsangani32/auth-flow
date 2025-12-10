import { Router } from "express";
import {
    getTodayAttendanceController,
    getUserAttendanceController,
    markAttendanceController,
} from "../controllers/attendance.controller";
import { authenticateToken } from "../middleware/auth.middleware";
import { uploadSingleImage } from "../middleware/upload.middleware";

const router = Router();

// Mark attendance (with image upload support)
router.post(
  "/mark",
  authenticateToken,
  uploadSingleImage,
  markAttendanceController
);

// Get user's attendance records (with optional date range)
router.get("/", authenticateToken, getUserAttendanceController);

// Get today's attendance
router.get("/today", authenticateToken, getTodayAttendanceController);

export default router;

