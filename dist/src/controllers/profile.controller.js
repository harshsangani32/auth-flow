"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfilePhotoController = exports.getProfileController = void 0;
const profile_service_1 = require("../services/profile.service");
const getProfileController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const user = await (0, profile_service_1.getUserProfile)(req.user.userId);
        res.status(200).json({
            message: "Profile retrieved successfully",
            user,
        });
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
};
exports.getProfileController = getProfileController;
const uploadProfilePhotoController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        const user = await (0, profile_service_1.updateProfilePhoto)(req.user.userId, req.file || undefined);
        res.status(200).json({
            message: "Profile photo updated",
            user,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.uploadProfilePhotoController = uploadProfilePhotoController;
