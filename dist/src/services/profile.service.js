"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfilePhoto = exports.getUserProfile = void 0;
const stream_1 = require("stream");
const cloudinary_1 = require("../config/cloudinary");
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
const getUserProfile = async (userId) => {
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
        throw new Error("User not found");
    }
    // Return user without password
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
};
exports.getUserProfile = getUserProfile;
const updateProfilePhoto = async (userId, file) => {
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
exports.updateProfilePhoto = updateProfilePhoto;
// Upload buffer to Cloudinary using upload_stream
const uploadToCloudinary = (file) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary_1.cloudinary.uploader.upload_stream({
            folder: "profile-photos",
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
