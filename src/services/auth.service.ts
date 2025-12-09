import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";
import { generateToken } from "../utils/jwt.util";

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
  });

  return await userRepo.save(newUser);
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
