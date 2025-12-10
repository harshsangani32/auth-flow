import { Readable } from "stream";
import { cloudinary } from "../config/cloudinary";
import { AppDataSource } from "../config/data-source";
import { Attendance } from "../entities/Attendance";
import { User } from "../entities/User";
import {
    basicFaceVerification,
    FaceRecognitionResult,
    verifyFaceWithCloudVision,
    verifyFaceWithDescriptor,
} from "../utils/face-recognition.util";

const attendanceRepo = AppDataSource.getRepository(Attendance);
const userRepo = AppDataSource.getRepository(User);

/**
 * Upload image to Cloudinary
 */
const uploadImageToCloudinary = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "attendance-photos",
        resource_type: "image",
      },
      (error, result) => {
        if (error || !result?.secure_url) {
          return reject(error || new Error("Failed to upload image"));
        }
        resolve(result.secure_url);
      }
    );

    Readable.from(file.buffer).pipe(uploadStream);
  });
};

/**
 * Mark attendance for a user
 */
export const markAttendance = async (
  userId: number,
  type: "IN" | "OUT",
  file?: Express.Multer.File,
  faceDescriptor?: number[],
  useCloudVision: boolean = false
) => {
  // Verify user exists
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  let imageUrl: string | null = null;
  let faceRecognitionResult: FaceRecognitionResult | null = null;
  let faceRecognitionData: string | null = null;

  // Process image if provided
  if (file) {
    // Upload image to Cloudinary
    imageUrl = await uploadImageToCloudinary(file);

    // Perform face recognition
    if (useCloudVision) {
      // Use Google Cloud Vision API
      faceRecognitionResult = await verifyFaceWithCloudVision(file.buffer);
    } else if (faceDescriptor && faceDescriptor.length > 0) {
      // Use face-api.js descriptor (sent from frontend)
      // In production, you'd retrieve stored descriptor from user profile
      const storedDescriptor = user.profilePhotoUrl
        ? null // Would retrieve from user's stored face descriptor
        : null;
      faceRecognitionResult = await verifyFaceWithDescriptor(
        faceDescriptor,
        storedDescriptor || undefined
      );
      faceRecognitionData = JSON.stringify({
        descriptor: faceDescriptor,
        method: "face-api.js",
      });
    } else {
      // Basic verification (just check if image exists)
      faceRecognitionResult = await basicFaceVerification(file.buffer);
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

/**
 * Get user's attendance records
 */
export const getUserAttendance = async (
  userId: number,
  startDate?: Date,
  endDate?: Date
) => {
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

/**
 * Get today's attendance for a user
 */
export const getTodayAttendance = async (userId: number) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return await getUserAttendance(userId, today, tomorrow);
};

