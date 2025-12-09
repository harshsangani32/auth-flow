import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

cloudinary.config({
  cloud_name: "diiemespy",
  api_key: "791514661934158",
  api_secret: "vG9fE8PXEdNTQ9tKO09XBDZw9kA",
});

export { cloudinary };

