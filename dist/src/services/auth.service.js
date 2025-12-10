"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.registerUser = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const dotenv_1 = __importDefault(require("dotenv"));
const data_source_1 = require("../config/data-source");
const User_1 = require("../entities/User");
const jwt_util_1 = require("../utils/jwt.util");
const email_service_1 = require("./email.service");
const otp_service_1 = require("./otp.service");
dotenv_1.default.config();
const userRepo = data_source_1.AppDataSource.getRepository(User_1.User);
const registerUser = async (firstName, lastName, email, password) => {
    const existing = await userRepo.findOne({ where: { email } });
    if (existing) {
        throw new Error("Email already registered");
    }
    const hashedPassword = await bcrypt_1.default.hash(password, Number(10));
    const newUser = userRepo.create({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        isVerified: false,
        otp: null,
        otpExpiry: null,
    });
    const savedUser = await userRepo.save(newUser);
    // Generate and send OTP
    const otp = (0, otp_service_1.generateOTP)();
    await (0, otp_service_1.saveOTP)(email, otp);
    await (0, email_service_1.sendOTPEmail)(email, otp, firstName);
    // Return user without password
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword;
};
exports.registerUser = registerUser;
const loginUser = async (email, password) => {
    const user = await userRepo.findOne({ where: { email } });
    if (!user) {
        throw new Error("Invalid email or password");
    }
    const isPasswordValid = await bcrypt_1.default.compare(password, user.password);
    if (!isPasswordValid) {
        throw new Error("Invalid email or password");
    }
    // Check if user is verified
    if (!user.isVerified) {
        throw new Error("Please verify your email before logging in. Check your email for OTP.");
    }
    // Generate JWT token
    const token = (0, jwt_util_1.generateToken)({
        userId: user.id,
        email: user.email,
    });
    // Return user without password and token
    const { password: _, ...userWithoutPassword } = user;
    return {
        user: userWithoutPassword,
        token,
    };
};
exports.loginUser = loginUser;
