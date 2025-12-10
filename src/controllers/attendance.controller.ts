import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import {
    getTodayAttendance,
    getUserAttendance,
    markAttendance,
} from "../services/attendance.service";

/**
 * Mark attendance (IN or OUT)
 * Supports:
 * - Image upload
 * - Face descriptor from face-api.js (sent in body)
 * - Cloud Vision API (via useCloudVision flag)
 */
export const markAttendanceController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { type, faceDescriptor, useCloudVision } = req.body;

    // Validate type
    if (!type || (type !== "IN" && type !== "OUT")) {
      return res
        .status(400)
        .json({ error: "Type must be either 'IN' or 'OUT'" });
    }

    // Parse face descriptor if provided (as JSON string or array)
    let parsedFaceDescriptor: number[] | undefined;
    if (faceDescriptor) {
      if (typeof faceDescriptor === "string") {
        try {
          parsedFaceDescriptor = JSON.parse(faceDescriptor);
        } catch {
          parsedFaceDescriptor = undefined;
        }
      } else if (Array.isArray(faceDescriptor)) {
        parsedFaceDescriptor = faceDescriptor;
      }
    }

    const result = await markAttendance(
      req.user.userId,
      type,
      req.file,
      parsedFaceDescriptor,
      useCloudVision === true || useCloudVision === "true"
    );

    res.status(201).json({
      message: `Attendance marked as ${type} successfully`,
      attendance: result.attendance,
      faceRecognition: result.faceRecognition,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get user's attendance records
 */
export const getUserAttendanceController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const { startDate, endDate } = req.query;

    let start: Date | undefined;
    let end: Date | undefined;

    if (startDate) {
      start = new Date(startDate as string);
      if (isNaN(start.getTime())) {
        return res.status(400).json({ error: "Invalid startDate format" });
      }
    }

    if (endDate) {
      end = new Date(endDate as string);
      if (isNaN(end.getTime())) {
        return res.status(400).json({ error: "Invalid endDate format" });
      }
    }

    const attendance = await getUserAttendance(
      req.user.userId,
      start,
      end
    );

    res.status(200).json({
      message: "Attendance records retrieved successfully",
      attendance,
      count: attendance.length,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

/**
 * Get today's attendance for the authenticated user
 */
export const getTodayAttendanceController = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const attendance = await getTodayAttendance(req.user.userId);

    res.status(200).json({
      message: "Today's attendance retrieved successfully",
      attendance,
      count: attendance.length,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

