'use client';

import { Check } from 'lucide-react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  icon?: ReactNode;
}

export interface SegmentedProps<T extends string> {
  options: readonly SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label?: string;
  labelledBy?: string;
  className?: string;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  labelledBy,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="group"
      aria-label={label}
      aria-labelledby={labelledBy}
      className={cn('flex gap-1 rounded-[12px] border border-rule bg-desk p-1', className)}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          aria-pressed={o.value === value}
          onClick={() => onChange(o.value)}
          className="inline-flex min-h-10 flex-1 basis-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 text-sm font-medium text-muted transition-[background-color,color] duration-150 aria-pressed:bg-paper aria-pressed:text-text aria-pressed:shadow-[0_1px_0_var(--rule)]"
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export interface SwitchProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'onChange' | 'role'
> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

export function Switch({ checked, onCheckedChange, className, ...props }: SwitchProps) {
  return (
    <span className="inline-flex min-h-11 items-center">
      <button
        {...props}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        className={cn(
          'relative h-7 w-12 flex-none cursor-pointer rounded-full bg-rule-strong p-0 aria-checked:bg-ink-700',
          'after:absolute after:top-[3px] after:left-[3px] after:size-[22px] after:rounded-full after:bg-white after:transition-transform after:duration-150 aria-checked:after:translate-x-5',
          className,
        )}
      />
    </span>
  );
}

export interface ToggleChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onChange'> {
  pressed: boolean;
  onPressedChange: (pressed: boolean) => void;
}

export function ToggleChip({
  pressed,
  onPressedChange,
  className,
  children,
  ...props
}: ToggleChipProps) {
  return (
    <button
      {...props}
      type="button"
      aria-pressed={pressed}
      onClick={() => onPressedChange(!pressed)}
      className={cn(
        'group inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-full border border-rule bg-paper px-3.5 text-sm font-medium text-text transition-[background-color,border-color] duration-150 aria-pressed:border-ink-700 aria-pressed:bg-tag-bg aria-pressed:text-tag-text',
        className,
      )}
    >
      <Check size={16} aria-hidden="true" className="hidden group-aria-pressed:inline-block" />
      {children}
    </button>
  );
}
