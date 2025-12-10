"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayAttendanceController = exports.getUserAttendanceController = exports.markAttendanceController = void 0;
const attendance_service_1 = require("../services/attendance.service");
/**
 * Mark attendance (IN or OUT)
 * Supports:
 * - Image upload
 * - Face descriptor from face-api.js (sent in body)
 * - Cloud Vision API (via useCloudVision flag)
 */
const markAttendanceController = async (req, res) => {
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
        let parsedFaceDescriptor;
        if (faceDescriptor) {
            if (typeof faceDescriptor === "string") {
                try {
                    parsedFaceDescriptor = JSON.parse(faceDescriptor);
                }
                catch {
                    parsedFaceDescriptor = undefined;
                }
            }
            else if (Array.isArray(faceDescriptor)) {
                parsedFaceDescriptor = faceDescriptor;
            }
        }
        const result = await (0, attendance_service_1.markAttendance)(req.user.userId, type, req.file, parsedFaceDescriptor, useCloudVision === true || useCloudVision === "true");
        res.status(201).json({
            message: `Attendance marked as ${type} successfully`,
            attendance: result.attendance,
            faceRecognition: result.faceRecognition,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.markAttendanceController = markAttendanceController;
/**
 * Get user's attendance records
 */
const getUserAttendanceController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const { startDate, endDate } = req.query;
        let start;
        let end;
        if (startDate) {
            start = new Date(startDate);
            if (isNaN(start.getTime())) {
                return res.status(400).json({ error: "Invalid startDate format" });
            }
        }
        if (endDate) {
            end = new Date(endDate);
            if (isNaN(end.getTime())) {
                return res.status(400).json({ error: "Invalid endDate format" });
            }
        }
        const attendance = await (0, attendance_service_1.getUserAttendance)(req.user.userId, start, end);
        res.status(200).json({
            message: "Attendance records retrieved successfully",
            attendance,
            count: attendance.length,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.getUserAttendanceController = getUserAttendanceController;
/**
 * Get today's attendance for the authenticated user
 */
const getTodayAttendanceController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const attendance = await (0, attendance_service_1.getTodayAttendance)(req.user.userId);
        res.status(200).json({
            message: "Today's attendance retrieved successfully",
            attendance,
            count: attendance.length,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.getTodayAttendanceController = getTodayAttendanceController;
