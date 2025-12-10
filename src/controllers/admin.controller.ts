import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { addUser, deleteUser, getAdminProfile, getUserCount, registerAdmin, requestAdminOTP, updateUser, verifyAdminOTPAndLogin } from "../services/admin.service";

export const getUserCountController = async (_req: Request, res: Response) => {
  try {
    const total = await getUserCount();
    res.status(200).json({ totalUsers: total });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch user count" });
  }
};

export const registerAdminController = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const admin = await registerAdmin(firstName, lastName, email, password);

    res.status(201).json({
      message: "Admin registered successfully",
      admin,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const requestAdminOTPController = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const result = await requestAdminOTP(email);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const verifyAdminOTPAndLoginController = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const result = await verifyAdminOTPAndLogin(email, otp);

    res.status(200).json({
      message: "Login successful",
      admin: result.admin,
      token: result.token,
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
};

export const getAdminProfileController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Admin not authenticated" });
    }

    const admin = await getAdminProfile(req.user.userId);

    res.status(200).json({
      message: "Profile retrieved successfully",
      admin,
    });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

export const addUserController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Admin not authenticated" });
    }

    const { firstName, lastName, email, password, isVerified } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: "First name, last name, email, and password are required" });
    }

    const user = await addUser(firstName, lastName, email, password, isVerified || false);

    res.status(201).json({
      message: "User created successfully",
      user,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const updateUserController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Admin not authenticated" });
    }

    const { id } = req.params;
    const { firstName, lastName, email, password, isVerified } = req.body;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const updateData: {
      firstName?: string;
      lastName?: string;
      email?: string;
      password?: string;
      isVerified?: boolean;
    } = {};

    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (password !== undefined) updateData.password = password;
    if (isVerified !== undefined) updateData.isVerified = isVerified;

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "At least one field must be provided for update" });
    }

    const user = await updateUser(userId, updateData);

    res.status(200).json({
      message: "User updated successfully",
      user,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteUserController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Admin not authenticated" });
    }

    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return res.status(400).json({ error: "Invalid user ID" });
    }

    const result = await deleteUser(userId);

    res.status(200).json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

