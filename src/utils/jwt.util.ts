// src/utils/jwt.util.ts
import dotenv from 'dotenv';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';

dotenv.config();

// SECRET proper type ma
const JWT_SECRET: Secret = process.env.JWT_SECRET || 'dev-secret';

export interface JwtPayload {
  userId: number;
  email: string;
}

// Token generate
export const signJwt = (
  payload: JwtPayload,
  options?: SignOptions
): string => {
  const expiresIn = process.env.JWT_EXPIRES_IN || '1h';
  const signOptions = {
    expiresIn,
    ...(options || {}),
  } as SignOptions;

  return jwt.sign(payload, JWT_SECRET, signOptions);
};

// Alias for backward compatibility
export const generateToken = signJwt;

// Token verify
export const verifyJwt = (token: string): JwtPayload => {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
};

// Alias for backward compatibility
export const verifyToken = verifyJwt;
