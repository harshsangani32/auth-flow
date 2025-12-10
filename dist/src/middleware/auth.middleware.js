"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = void 0;
const jwt_util_1 = require("../utils/jwt.util");
const authenticateToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            return res.status(401).json({ error: "Authorization header is required" });
        }
        const token = authHeader.startsWith("Bearer ")
            ? authHeader.substring(7)
            : authHeader;
        if (!token) {
            return res.status(401).json({ error: "Token is required" });
        }
        const decoded = (0, jwt_util_1.verifyToken)(token);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(401).json({ error: error.message || "Invalid token" });
    }
};
exports.authenticateToken = authenticateToken;
