"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.verifyJwt = exports.generateToken = exports.signJwt = void 0;
// src/utils/jwt.util.ts
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
dotenv_1.default.config();
// SECRET proper type ma
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
// Token generate
const signJwt = (payload, options) => {
    const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
    const signOptions = {
        expiresIn,
        ...(options || {}),
    };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, signOptions);
};
exports.signJwt = signJwt;
// Alias for backward compatibility
exports.generateToken = exports.signJwt;
// Token verify
const verifyJwt = (token) => {
    return jsonwebtoken_1.default.verify(token, JWT_SECRET);
};
exports.verifyJwt = verifyJwt;
// Alias for backward compatibility
exports.verifyToken = exports.verifyJwt;
