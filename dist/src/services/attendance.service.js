"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayAttendance = exports.getUserAttendance = exports.markAttendance = void 0;
const stream_1 = require("stream");
const cloudinary_1 = require("../config/cloudinary");
const data_source_1 = require("../config/data-source");
const Attendance_1 = require("../entities/Attendance");
const User_1 = require("../entities/User");
const face_recognition_util_1 = require("../utils/face-recognition.util");
const attendanceRepo = data_source_1.AppDataSource.getRepository(Attendance_1.Attendance);
const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
/**
 * Upload image to Cloudinary
 */
const uploadImageToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.cloudinary.uploader.upload_stream({
            folder: "attendance-photos",
            resource_type: "image",
        }, (error, result) => {
            if (error || !result?.secure_url) {
                return reject(error || new Error("Failed to upload image"));
            }
            resolve(result.secure_url);
        });
        stream_1.Readable.from(file.buffer).pipe(uploadStream);
    });
};
/**
 * Mark attendance for a user
 */
const markAttendance = async (userId, type, file, faceDescriptor, useCloudVision = false) => {
    // Verify user exists
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
        throw new Error("User not found");
    }
    let imageUrl = null;
    let faceRecognitionResult = null;
    let faceRecognitionData = null;
    // Process image if provided
    if (file) {
        // Upload image to Cloudinary
        imageUrl = await uploadImageToCloudinary(file);
        // Perform face recognition
        if (useCloudVision) {
            // Use Google Cloud Vision API
            faceRecognitionResult = await (0, face_recognition_util_1.verifyFaceWithCloudVision)(file.buffer);
        }
        else if (faceDescriptor && faceDescriptor.length > 0) {
            // Use face-api.js descriptor (sent from frontend)
            // In production, you'd retrieve stored descriptor from user profile
            const storedDescriptor = user.profilePhotoUrl
                ? null // Would retrieve from user's stored face descriptor
                : null;
            faceRecognitionResult = await (0, face_recognition_util_1.verifyFaceWithDescriptor)(faceDescriptor, storedDescriptor || undefined);
            faceRecognitionData = JSON.stringify({
                descriptor: faceDescriptor,
                method: "face-api.js",
            });
        }
        else {
            // Basic verification (just check if image exists)
            faceRecognitionResult = await (0, face_recognition_util_1.basicFaceVerification)(file.buffer);
        }
        // Store recognition result
        if (faceRecognitionResult) {
            faceRecognitionData = JSON.stringify({
                verified: faceRecognitionResult.verified,
                confidence: faceRecognitionResult.confidence,
                method: faceRecognitionResult.method,
                error: faceRecognitionResult.error,
            });
        }
    }
    // Create attendance record
    const attendance = attendanceRepo.create({
        user,
        type,
        timestamp: new Date(),
        imageUrl,
        faceVerified: faceRecognitionResult?.verified || false,
        faceRecognitionData,
    });
    const savedAttendance = await attendanceRepo.save(attendance);
    return {
        attendance: savedAttendance,
        faceRecognition: faceRecognitionResult,
    };
};
exports.markAttendance = markAttendance;
/**
 * Get user's attendance records
 */
const getUserAttendance = async (userId, startDate, endDate) => {
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
        throw new Error("User not found");
    }
    const queryBuilder = attendanceRepo
        .createQueryBuilder("attendance")
        .leftJoinAndSelect("attendance.user", "user")
        .where("user.id = :userId", { userId })
        .orderBy("attendance.timestamp", "DESC");
    if (startDate) {
        queryBuilder.andWhere("attendance.timestamp >= :startDate", { startDate });
    }
    if (endDate) {
        queryBuilder.andWhere("attendance.timestamp <= :endDate", { endDate });
    }
    return await queryBuilder.getMany();
};
exports.getUserAttendance = getUserAttendance;
/**
 * Get today's attendance for a user
 */
const getTodayAttendance = async (userId) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return await (0, exports.getUserAttendance)(userId, today, tomorrow);
};
exports.getTodayAttendance = getTodayAttendance;
