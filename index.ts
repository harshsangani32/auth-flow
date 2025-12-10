import dotenv from "dotenv";
import express from "express";
import { AppDataSource } from './src/config/data-source';

import adminRoutes from "./src/routes/admin.routes";
import authRoutes from "./src/routes/auth.routes";

dotenv.config();
const app = express();

app.use(express.json());
app.use("/auth", authRoutes);
app.use("/admin", adminRoutes);

const PORT = 5000;

AppDataSource.initialize()
  .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => console.log(`Server running at ${PORT}`));
  })
  .catch((err) => console.error("DB Error:", err));
