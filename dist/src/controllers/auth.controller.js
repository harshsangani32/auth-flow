"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginController = exports.registerController = void 0;
const auth_service_1 = require("../services/auth.service");
const registerController = async (req, res) => {
    try {
        const { firstName, lastName, email, password } = req.body;
        const user = await (0, auth_service_1.registerUser)(firstName, lastName, email, password);
        res.status(201).json({
            message: "User registered successfully",
            user,
        });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
};
exports.registerController = registerController;
const loginController = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required" });
        }
        const result = await (0, auth_service_1.loginUser)(email, password);
        res.status(200).json({
            message: "Login successful",
            user: result.user,
            token: result.token,
        });
    }
    catch (error) {
        res.status(401).json({ error: error.message });
    }
};
exports.loginController = loginController;
