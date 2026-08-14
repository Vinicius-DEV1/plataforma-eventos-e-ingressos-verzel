import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Junta classes condicionais (clsx) e resolve conflitos entre utilitários do
 * Tailwind (tailwind-merge) — sem isso, `px-2 px-4` manteria as duas.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
