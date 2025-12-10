"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppDataSource = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const Admin_1 = require("../entities/Admin");
const Attendance_1 = require("../entities/Attendance");
const User_1 = require("../entities/User");
dotenv_1.default.config();
exports.AppDataSource = new typeorm_1.DataSource({
    type: "postgres",
    host: "localhost",
    port: 5432,
    username: "postgres",
    password: "Mysql@2003",
    database: "auth-flow",
    entities: [User_1.User, Admin_1.Admin, Attendance_1.Attendance],
    synchronize: true, // auto create tables for beginners
});
