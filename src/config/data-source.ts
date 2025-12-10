import dotenv from "dotenv";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { Admin } from "../entities/Admin";
import { Attendance } from "../entities/Attendance";
import { User } from "../entities/User";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "Mysql@2003",
  database: "auth-flow",
  entities: [User, Admin, Attendance],
  synchronize: true, // auto create tables for beginners
});

