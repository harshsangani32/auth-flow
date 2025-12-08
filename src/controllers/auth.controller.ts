import { Request, Response } from "express";
import { registerUser } from "../services/auth.service";

export const registerController = async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    const user = await registerUser(firstName, lastName, email, password);

    res.status(201).json({
      message: "User registered successfully",
      user,
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
