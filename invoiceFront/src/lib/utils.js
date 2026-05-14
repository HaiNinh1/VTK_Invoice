import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * cn — merge Tailwind class strings safely (resolves conflicts, drops falsy).
 * Standard shadcn helper.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}
