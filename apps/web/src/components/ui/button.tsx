import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'quiet';

export interface ButtonStyleOptions {
  variant?: ButtonVariant;
  icon?: boolean;
  full?: boolean;
  className?: string;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-ink-700 text-on-primary hover:bg-primary-hover',
  secondary: 'border-rule bg-transparent text-text hover:border-rule-strong hover:bg-paper',
  quiet: 'bg-transparent px-3 text-ink-700 hover:bg-tag-bg',
};

export function buttonClasses({
  variant = 'primary',
  icon = false,
  full = false,
  className,
}: ButtonStyleOptions = {}): string {
  return cn(
    'inline-flex h-11 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-control border border-transparent px-5 text-[15px] font-medium leading-none no-underline transition-[background-color,color,border-color] duration-150 disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTS[variant],
    icon && 'w-11 px-0',
    full && 'w-full',
    className,
  );
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, Omit<ButtonStyleOptions, 'className'> {}

export function Button({ variant, icon, full, className, type = 'button', ...props }: ButtonProps) {
  return (
    <button type={type} className={buttonClasses({ variant, icon, full, className })} {...props} />
  );
}

export const linkClasses =
  'inline-flex min-h-11 items-center font-medium text-ink-700 no-underline hover:underline';
