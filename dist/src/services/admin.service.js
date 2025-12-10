"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.addUser = exports.getAdminProfile = exports.verifyAdminOTPAndLogin = exports.requestAdminOTP = exports.registerAdmin = exports.getUserCount = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const data_source_1 = require("../config/data-source");
const Admin_1 = require("../entities/Admin");
const User_1 = require("../entities/User");
const jwt_util_1 = require("../utils/jwt.util");
const email_service_1 = require("./email.service");
const otp_service_1 = require("./otp.service");
const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
const adminRepo = data_source_1.AppDataSource.getRepository(Admin_1.Admin);
const getUserCount = async () => {
    return await userRepo.count();
};
exports.getUserCount = getUserCount;
const registerAdmin = async (firstName, lastName, email, password) => {
    // Enforce unique email across users and admins
    const existingUser = await userRepo.findOne({ where: { email } });
    const existingAdmin = await adminRepo.findOne({ where: { email } });
    if (existingUser || existingAdmin) {
        throw new Error("Email already registered");
    }
    const hashedPassword = await bcrypt_1.default.hash(password, Number(10));
    // Create a linked user record; mark verified so admin can log in immediately
    const linkedUser = userRepo.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isVerified: true,
        otp: null,
        otpExpiry: null,
    });
    const savedUser = await userRepo.save(linkedUser);
    const admin = adminRepo.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        user: savedUser,
    });
    const savedAdmin = await adminRepo.save(admin);
    const { password: _, ...adminWithoutPassword } = savedAdmin;
    return adminWithoutPassword;
};
exports.registerAdmin = registerAdmin;
// Request OTP for admin login
const requestAdminOTP = async (email) => {
    const admin = await adminRepo.findOne({
        where: { email },
        relations: ["user"]
    });
    if (!admin || !admin.user) {
        throw new Error("Admin not found");
    }
    // Generate and save OTP to linked user
    const otp = (0, otp_service_1.generateOTP)();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);
    admin.user.otp = otp;
    admin.user.otpExpiry = otpExpiry;
    await userRepo.save(admin.user);
    // Send OTP email
    await (0, email_service_1.sendOTPEmail)(email, otp, admin.firstName);
    return { message: "OTP sent to your email" };
};
exports.requestAdminOTP = requestAdminOTP;
// Verify OTP and login admin
const verifyAdminOTPAndLogin = async (email, otp) => {
    const admin = await adminRepo.findOne({
        where: { email },
        relations: ["user"]
    });
    if (!admin || !admin.user) {
        throw new Error("Admin not found");
    }
    const user = admin.user;
    // Check if OTP exists
    if (!user.otp || !user.otpExpiry) {
        throw new Error("No OTP found. Please request an OTP first.");
    }
    // Check if OTP is expired
    if (new Date() > user.otpExpiry) {
        throw new Error("OTP has expired. Please request a new OTP.");
    }
    // Check if OTP matches
    if (user.otp !== otp) {
        throw new Error("Invalid OTP");
    }
    // Clear OTP and mark as verified
    user.otp = null;
    user.otpExpiry = null;
    user.isVerified = true;
    await userRepo.save(user);
    // Generate JWT token
    const token = (0, jwt_util_1.generateToken)({
        userId: admin.id,
        email: admin.email,
    });
    // Return admin without password and token
    const { password: _, ...adminWithoutPassword } = admin;
    return {
        admin: adminWithoutPassword,
        token,
    };
};
exports.verifyAdminOTPAndLogin = verifyAdminOTPAndLogin;
// Get admin profile
const getAdminProfile = async (adminId) => {
    const admin = await adminRepo.findOne({
        where: { id: adminId },
        relations: ["user"]
    });
    if (!admin) {
        throw new Error("Admin not found");
    }
    // Return admin without password
    const { password: _, ...adminWithoutPassword } = admin;
    return adminWithoutPassword;
};
exports.getAdminProfile = getAdminProfile;
// Add user (admin can create users)
const addUser = async (firstName, lastName, email, password, isVerified = false) => {
    // Check if email already exists in users or admins
    const existingUser = await userRepo.findOne({ where: { email } });
    const existingAdmin = await adminRepo.findOne({ where: { email } });
    if (existingUser || existingAdmin) {
        throw new Error("Email already registered");
    }
    const hashedPassword = await bcrypt_1.default.hash(password, 10);
    const newUser = userRepo.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isVerified,
        otp: null,
        otpExpiry: null,
    });
    const savedUser = await userRepo.save(newUser);
    // If not verified, generate and send OTP
    if (!isVerified) {
        const otp = (0, otp_service_1.generateOTP)();
        await (0, otp_service_1.saveOTP)(email, otp);
        await (0, email_service_1.sendOTPEmail)(email, otp, firstName);
    }
    // Return user without password
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
};
exports.addUser = addUser;
// Update user
const updateUser = async (userId, updateData) => {
    const user = await userRepo.findOne({ where: { id: userId } });
    if (!user) {
        throw new Error("User not found");
    }
    // Check if email is being updated and if it's already taken
    if (updateData.email && updateData.email !== user.email) {
        const existingUser = await userRepo.findOne({ where: { email: updateData.email } });
        const existingAdmin = await adminRepo.findOne({ where: { email: updateData.email } });
        if (existingUser || existingAdmin) {
            throw new Error("Email already registered");
        }
        user.email = updateData.email;
    }
    // Update other fields
    if (updateData.firstName !== undefined) {
        user.firstName = updateData.firstName;
    }
    if (updateData.lastName !== undefined) {
        user.lastName = updateData.lastName;
    }
    if (updateData.password !== undefined) {
        user.password = await bcrypt_1.default.hash(updateData.password, 10);
    }
    if (updateData.isVerified !== undefined) {
        user.isVerified = updateData.isVerified;
        // Clear OTP if user is being verified
        if (updateData.isVerified) {
            user.otp = null;
            user.otpExpiry = null;
        }
    }
    const updatedUser = await userRepo.save(user);
    // Return user without password
    const { password: _, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
};
exports.updateUser = updateUser;
// Delete user
const deleteUser = async (userId) => {
    const user = await userRepo.findOne({
        where: { id: userId },
        relations: [] // Check if user is linked to admin
    });
    if (!user) {
        throw new Error("User not found");
    }
    // Check if user is linked to an admin
    const linkedAdmin = await adminRepo.findOne({
        where: { user: { id: userId } },
        relations: ["user"]
    });
    if (linkedAdmin) {
        throw new Error("Cannot delete user that is linked to an admin account");
    }
    await userRepo.remove(user);
    return { message: "User deleted successfully" };
};
exports.deleteUser = deleteUser;
