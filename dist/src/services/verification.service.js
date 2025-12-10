"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyUserOTP = void 0;
const otp_service_1 = require("./otp.service");
const verifyUserOTP = async (email, otp) => {
    const isValid = await (0, otp_service_1.verifyOTP)(email, otp);
    if (!isValid) {
        throw new Error("Invalid or expired OTP");
    }
    return { message: "Email verified successfully" };
};
exports.verifyUserOTP = verifyUserOTP;
