import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Gộp class Tailwind có điều kiện và xử lý xung đột class.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
