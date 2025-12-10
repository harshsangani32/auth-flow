import bcrypt from "bcrypt";
import { AppDataSource } from "../config/data-source";
import { Admin } from "../entities/Admin";
import { User } from "../entities/User";
import { generateToken } from "../utils/jwt.util";
import { sendOTPEmail } from "./email.service";
import { generateOTP, saveOTP } from "./otp.service";

const userRepo = AppDataSource.getRepository(User);
const adminRepo = AppDataSource.getRepository(Admin);

export const getUserCount = async () => {
  return await userRepo.count();
};

export const registerAdmin = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string
) => {
  // Enforce unique email across users and admins
  const existingUser = await userRepo.findOne({ where: { email } });
  const existingAdmin = await adminRepo.findOne({ where: { email } });
  if (existingUser || existingAdmin) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, Number(10));

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

// Request OTP for admin login
export const requestAdminOTP = async (email: string) => {
  const admin = await adminRepo.findOne({ 
    where: { email },
    relations: ["user"]
  });
  
  if (!admin || !admin.user) {
    throw new Error("Admin not found");
  }

  // Generate and save OTP to linked user
  const otp = generateOTP();
  const otpExpiry = new Date();
  otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);

  admin.user.otp = otp;
  admin.user.otpExpiry = otpExpiry;
  await userRepo.save(admin.user);

  // Send OTP email
  await sendOTPEmail(email, otp, admin.firstName);

  return { message: "OTP sent to your email" };
};

// Verify OTP and login admin
export const verifyAdminOTPAndLogin = async (email: string, otp: string) => {
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
  const token = generateToken({
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

// Get admin profile
export const getAdminProfile = async (adminId: number) => {
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

// Add user (admin can create users)
export const addUser = async (
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  isVerified: boolean = false
) => {
  // Check if email already exists in users or admins
  const existingUser = await userRepo.findOne({ where: { email } });
  const existingAdmin = await adminRepo.findOne({ where: { email } });
  if (existingUser || existingAdmin) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

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
    const otp = generateOTP();
    await saveOTP(email, otp);
    await sendOTPEmail(email, otp, firstName);
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = savedUser;
  return userWithoutPassword;
};

// Update user
export const updateUser = async (
  userId: number,
  updateData: {
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    isVerified?: boolean;
  }
) => {
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
    user.password = await bcrypt.hash(updateData.password, 10);
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

// Delete user
export const deleteUser = async (userId: number) => {
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

