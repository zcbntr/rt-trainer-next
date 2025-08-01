import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { splitAndPadNumber } from "../sim-utils/string-processors";
import { type z } from "zod";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function convertToSubCurrency(amount: number, factor = 100): number {
  return Math.round(amount * factor);
}

export function randomString(length: number, chars = "aA#"): string {
  let mask = "";
  if (chars.includes("a")) mask += "abcdefghijklmnopqrstuvwxyz";
  if (chars.includes("A")) mask += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (chars.includes("#")) mask += "0123456789";
  if (chars.includes("!")) mask += "~`!@#$%^&*()_+-={}[]:\";'<>?,./|\\";
  let result = "";
  for (let i = length; i > 0; --i)
    result += mask[Math.floor(Math.random() * mask.length)];
  return result;
}

/**
 * Generates a pseudo-random number based on a seed. Based on djb2 algorithm
 * @param seed - seed for the random number generator
 * @returns - pseudo-random number
 */
export function seedStringToNumber(str: string): number {
  let hash = 5381;

  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash + str.charCodeAt(i)) | 0;
  }

  return Math.abs(hash >>> 0);
}

export function initials(name: string): string {
  const nameParts = name.split(" ");
  if (nameParts.length === 1) {
    return `${nameParts[0]?.substring(0, 1).toLocaleUpperCase()}`;
  } else if (nameParts.length === 2) {
    return `${nameParts[0]?.substring(0, 1)}${nameParts[1]?.substring(0, 1)}`.toLocaleUpperCase();
  } else if (nameParts.length === 3) {
    return `${nameParts[0]?.substring(0, 1)}${nameParts[1]?.substring(0, 1)}${nameParts[2]?.substring(0, 1)}`.toLocaleUpperCase();
  } else {
    return `${nameParts[0]?.substring(0, 1)}${nameParts[1]?.substring(0, 1)}${nameParts[nameParts.length - 1]?.substring(0, 1)}`.toLocaleUpperCase();
  }
}

// Function to generate a seeded normal distribution
export function seededNormalDistribution(
  seedString: string,
  mean: number,
  standardDeviation: number,
): number {
  // Generate two pseudo-random numbers from seed for the Box-Muller transform
  const [v1, v2] = splitAndPadNumber(seedStringToNumber(seedString));
  const u1: number = 1 / v1;
  const u2: number = 1 / v2;

  // Box-Muller transform
  const z0: number = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

  // Scale and shift to get the desired mean and standard deviation
  const result: number = z0 * standardDeviation + mean;

  return result;
}

export const transformZodErrors = (error: z.ZodError) => {
  return error.issues.map((issue) => ({
    path: issue.path.join("."),
    message: issue.message,
  }));
};

export const numberToAlphabetLetter = (num: number): string => {
  return String.fromCharCode(65 + (num % 26));
};

export const getShorthandDirection = (degrees: number): string => {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(degrees / 45) % 8]!;
};
