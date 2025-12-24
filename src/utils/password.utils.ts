/**
 * Password Hashing Utilities
 * Centralized password hashing and validation logic
 */

import bcryptjs from "bcryptjs";

const SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 6;

/**
 * Validate password meets requirements
 */
export const validatePassword = (password: string): { valid: boolean; message?: string } => {
  if (!password || password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    };
  }
  return { valid: true };
};

/**
 * Hash a password
 */
export const hashPassword = async (password: string): Promise<string> => {
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new Error(validation.message);
  }
  const salt = await bcryptjs.genSalt(SALT_ROUNDS);
  return bcryptjs.hash(password, salt);
};

/**
 * Compare password with hash
 */
export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcryptjs.compare(password, hash);
};

/**
 * Check if new password is different from existing
 */
export const isPasswordDifferent = async (newPassword: string, currentHash: string): Promise<boolean> => {
  const isSame = await comparePassword(newPassword, currentHash);
  return !isSame;
};
