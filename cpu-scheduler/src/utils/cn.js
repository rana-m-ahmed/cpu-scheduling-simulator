/**
 * Tailwind-aware class name merger used by the app shell.
 */
import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}