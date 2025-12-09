import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { getUserProfile } from "../services/profile.service";

export const getProfileController = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "User not authenticated" });
    }

    const user = await getUserProfile(req.user.userId);

    res.status(200).json({
      message: "Profile retrieved successfully",
      user,
    });
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
};

