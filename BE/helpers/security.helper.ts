import bcrypt from "bcryptjs";
import crypto from "crypto";

const SALT_ROUNDS = 10;

export const hashPassword = async (plainText: string): Promise<string> => {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(plainText, salt);
};

export const comparePassword = async (plainText: string, hashed: string): Promise<boolean> => {
  return bcrypt.compare(plainText, hashed);
};

export const generateNumericOtp = (length = 6): string => {
  const max = Math.pow(10, length);
  const min = Math.pow(10, length - 1);
  const randomNum = crypto.randomInt(min, max);
  return randomNum.toString();
};
