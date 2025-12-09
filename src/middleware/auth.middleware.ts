import type { Request } from "express";
import { NextFunction, Response } from "express";
import { verifyToken } from "../utils/jwt.util";

export interface AuthRequest extends Request {
  user?: {
    userId: number;
    email: string;
  };
  file?: Express.Multer.File;
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ error: "Authorization header is required" });
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.substring(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({ error: "Token is required" });
    }

    const decoded = verifyToken(token);
    req.user = decoded;
    next();
  } catch (error: any) {
    return res.status(401).json({ error: error.message || "Invalid token" });
  }
};

