import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format property type for display
 * Converts underscore format to proper capitalized format
 * @param type - Property type (e.g., 'boarding_house', 'dormitory')
 * @returns Formatted type (e.g., 'Boarding House', 'Dormitory')
 */
export function formatPropertyType(type: string): string {
  if (!type) return '';
  
  return type
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
