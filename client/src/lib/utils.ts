/**
 * utils.ts — Shared utility functions for the frontend.
 */

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS class names intelligently.
 * Combines clsx (conditional classes) with tailwind-merge (conflict resolution)
 * so that later classes override earlier ones instead of duplicating.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
