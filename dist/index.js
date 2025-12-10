"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const express_1 = __importDefault(require("express"));
const data_source_1 = require("./src/config/data-source");
const admin_routes_1 = __importDefault(require("./src/routes/admin.routes"));
const attendance_routes_1 = __importDefault(require("./src/routes/attendance.routes"));
const auth_routes_1 = __importDefault(require("./src/routes/auth.routes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use("/auth", auth_routes_1.default);
app.use("/admin", admin_routes_1.default);
app.use("/attendance", attendance_routes_1.default);
const PORT = 5000;
data_source_1.AppDataSource.initialize()
    .then(() => {
    console.log("Database connected");
    app.listen(PORT, () => console.log(`Server running at ${PORT}`));
})
    .catch((err) => console.error("DB Error:", err));
