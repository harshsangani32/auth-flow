"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOTPEmail = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const nodemailer_1 = __importDefault(require("nodemailer"));
dotenv_1.default.config();
// Create transporter (using Gmail as example, you can configure for other services)
const createTransporter = () => {
    return nodemailer_1.default.createTransport({
        service: "gmail",
        auth: {
            user: "harshsangani32@gmail.com",
            pass: "rurrwabauqosjrdo", // Use App Password for Gmail
        },
    });
};
const sendOTPEmail = async (email, otp, firstName) => {
    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Verify Your Email - OTP Code",
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Email Verification</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for registering! Please use the following OTP to verify your email address:</p>
          <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
            <h1 style="color: #007bff; font-size: 32px; margin: 0;">${otp}</h1>
          </div>
          <p>This OTP will expire in 10 minutes.</p>
          <p>If you didn't register for this account, please ignore this email.</p>
          <p>Best regards,<br>Auth Flow Team</p>
        </div>
      `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
    }
    catch (error) {
        console.error("Error sending email:", error);
        throw new Error("Failed to send OTP email");
    }
};
exports.sendOTPEmail = sendOTPEmail;
