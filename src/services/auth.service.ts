import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { generateToken } from "../utils/jwt.util";
import { sendOTPEmail } from "./email.service";
import { generateOTP, saveOTP } from "./otp.service";

dotenv.config();
const userRepo = AppDataSource.getRepository(User);

export const registerUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => {
  const existing = await userRepo.findOne({ where: { email } });
  if (existing) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, Number(10));

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
  const otp = generateOTP();
  await saveOTP(email, otp);
  await sendOTPEmail(email, otp, firstName);

  // Return user without password
  const { password: _, ...userWithoutPassword } = savedUser;
  return userWithoutPassword;
};

export const loginUser = async (email: string, password: string) => {
  const user = await userRepo.findOne({ where: { email } });
  if (!user) {
    throw new Error("Invalid email or password");
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new Error("Invalid email or password");
  }

  // Check if user is verified
  if (!user.isVerified) {
    throw new Error("Please verify your email before logging in. Check your email for OTP.");
  }

  // Generate JWT token
  const token = generateToken({
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
