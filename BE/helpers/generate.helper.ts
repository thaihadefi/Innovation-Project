import { randomInt } from "crypto";

export const generateRandomNumber = (length: number): string => {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += randomInt(0, 10).toString();
  }
  return result;
};
