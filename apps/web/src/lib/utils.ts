import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// twMerge resolves conflicting Tailwind utilities; without it `px-2 px-4`
// would keep both.
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
