import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

const userRepo = AppDataSource.getRepository(User);

// Generate 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Save OTP to user
export const saveOTP = async (email: string, otp: string): Promise<void> => {
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

// Verify OTP
export const verifyOTP = async (email: string, otp: string): Promise<boolean> => {
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

