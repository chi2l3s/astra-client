import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export const cx = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const sortCx = <T extends Record<string, string>>(styles: T) => styles;
