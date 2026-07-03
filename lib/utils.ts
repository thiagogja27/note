
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const maskPlate = (value: string) => {
  if (!value) return "";

  value = value.toUpperCase().replace(/[^A-Z0-9]/g, '');

  // Padrão Mercosul: ABC1D23
  if (/^[A-Z]{3}[0-9][A-Z]/.test(value)) {
    return value.substring(0, 7);
  }

  // Padrão tradicional: ABC-1234
  if (value.length > 3) {
    return value.substring(0, 3) + '-' + value.substring(3, 7);
  }

  return value;
};
