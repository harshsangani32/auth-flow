import dotenv from "dotenv";
import "reflect-metadata";
import { DataSource } from "typeorm";
import { User } from "../entities/User";

dotenv.config();

export const AppDataSource = new DataSource({
  type: "postgres",
  host: "localhost",
  port: 5432,
  username: "postgres",
  password: "Mysql@2003",
  database: "auth-flow",
  entities: [User],
  synchronize: true, // auto create tables for beginners
});

