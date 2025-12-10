"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUserController = exports.updateUserController = exports.addUserController = exports.getAdminProfileController = exports.verifyAdminOTPAndLoginController = exports.requestAdminOTPController = exports.registerAdminController = exports.getUserCountController = void 0;
const admin_service_1 = require("../services/admin.service");
const getUserCountController = async (_req, res) => {
    try {
        const total = await (0, admin_service_1.getUserCount)();
        res.status(200).json({ totalUsers: total });
    }
    catch (error) {
        res.status(500).json({ error: error.message || "Failed to fetch user count" });
    }
};
exports.getUserCountController = getUserCountController;
const registerAdminController = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: "All fields are required" });
        }
        const admin = await (0, admin_service_1.registerAdmin)(firstName, lastName, email, password);
        res.status(201).json({
            message: "Admin registered successfully",
            admin,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.registerAdminController = registerAdminController;
const requestAdminOTPController = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }
        const result = await (0, admin_service_1.requestAdminOTP)(email);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.requestAdminOTPController = requestAdminOTPController;
const verifyAdminOTPAndLoginController = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }
        const result = await (0, admin_service_1.verifyAdminOTPAndLogin)(email, otp);
        res.status(200).json({
            message: "Login successful",
            admin: result.admin,
            token: result.token,
        });
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
};
exports.verifyAdminOTPAndLoginController = verifyAdminOTPAndLoginController;
const getAdminProfileController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Admin not authenticated" });
        }
        const admin = await (0, admin_service_1.getAdminProfile)(req.user.userId);
        res.status(200).json({
            message: "Profile retrieved successfully",
            admin,
        });
    }
    catch (error) {
        res.status(404).json({ error: error.message });
    }
};
exports.getAdminProfileController = getAdminProfileController;
const addUserController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Admin not authenticated" });
        }
        const { firstName, lastName, email, password, isVerified } = req.body;
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({ error: "First name, last name, email, and password are required" });
        }
        const user = await (0, admin_service_1.addUser)(firstName, lastName, email, password, isVerified || false);
        res.status(201).json({
            message: "User created successfully",
            user,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.addUserController = addUserController;
const updateUserController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Admin not authenticated" });
        }
        const { id } = req.params;
        const { firstName, lastName, email, password, isVerified } = req.body;
        if (!id) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const userId = parseInt(id, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        const updateData = {};
        if (firstName !== undefined)
            updateData.firstName = firstName;
        if (lastName !== undefined)
            updateData.lastName = lastName;
        if (email !== undefined)
            updateData.email = email;
        if (password !== undefined)
            updateData.password = password;
        if (isVerified !== undefined)
            updateData.isVerified = isVerified;
        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ error: "At least one field must be provided for update" });
        }
        const user = await (0, admin_service_1.updateUser)(userId, updateData);
        res.status(200).json({
            message: "User updated successfully",
            user,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.updateUserController = updateUserController;
const deleteUserController = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: "Admin not authenticated" });
        }
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "User ID is required" });
        }
        const userId = parseInt(id, 10);
        if (isNaN(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }
        const result = await (0, admin_service_1.deleteUser)(userId);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.deleteUserController = deleteUserController;
