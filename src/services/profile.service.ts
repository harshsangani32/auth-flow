import { AppDataSource } from "../config/data-source";
import { User } from "../entities/User";

const userRepo = AppDataSource.getRepository(User);

export const getUserProfile = async (userId: number) => {
  const user = await userRepo.findOne({ where: { id: userId } });
  if (!user) {
    throw new Error("User not found");
  }

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

