import { Request, Response } from "express";
import { verifyUserOTP } from "../services/verification.service";

export const verifyOTPController = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const result = await verifyUserOTP(email, otp);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

