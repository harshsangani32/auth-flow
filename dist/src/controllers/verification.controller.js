"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyOTPController = void 0;
const verification_service_1 = require("../services/verification.service");
const verifyOTPController = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) {
            return res.status(400).json({ error: "Email and OTP are required" });
        }
        const result = await (0, verification_service_1.verifyUserOTP)(email, otp);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.verifyOTPController = verifyOTPController;
