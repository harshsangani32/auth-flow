import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

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
