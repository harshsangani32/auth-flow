import { Readable } from "stream";
import { cloudinary } from "../config/cloudinary";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

const userRepo = AppDataSource.getRepository(User);

export const getUserProfile = async (userId: number) => {
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const updateProfilePhoto = async (
  userId: number,
  file?: Express.Multer.File
) => {
  if (!file) {
    throw new Error("No file uploaded");
  }

  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  const imageUrl = await uploadToCloudinary(file);
  user.profilePhotoUrl = imageUrl;
  const saved = await userRepo.save(user);

  const { password: _, ...userWithoutPassword } = saved;
  return userWithoutPassword;
};

// Upload buffer to Cloudinary using upload_stream
const uploadToCloudinary = (file: Express.Multer.File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "profile-photos",
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

