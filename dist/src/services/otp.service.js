"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTP = exports.saveOTP = exports.generateOTP = void 0;
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};
exports.generateOTP = generateOTP;
// Save OTP to user
const saveOTP = async (email, otp) => {
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
        throw new Error("User not found");
    }
    // OTP expires in 10 minutes
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await userRepo.save(user);
};
exports.saveOTP = saveOTP;
// Verify OTP
const verifyOTP = async (email, otp) => {
    const user = await userRepo.findOne({ where: { email } });
    if (!user || !user.otp || !user.otpExpiry) {
        return false;
    }
    // Check if OTP is expired
    if (new Date() > user.otpExpiry) {
        return false;
    }
    // Check if OTP matches
    if (user.otp !== otp) {
        return false;
    }
    // Mark user as verified and clear OTP
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await userRepo.save(user);
    return true;
};
exports.verifyOTP = verifyOTP;
