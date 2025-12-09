import { verifyOTP } from "./otp.service";

export const verifyUserOTP = async (email: string, otp: string) => {
  const isValid = await verifyOTP(email, otp);
  if (!isValid) {
    throw new Error("Invalid or expired OTP");
  }
  return { message: "Email verified successfully" };
};

