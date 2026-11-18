'use client';

import { formatRupiah, parseRupiahInput } from '@coinbook/shared';
import type { InputHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';
import { controlClasses } from './field';

export interface MoneyInputProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> {
  value: number | null;
  onValueChange: (value: number | null) => void;
  large?: boolean;
  prefix?: string;
}

export function MoneyInput({
  value,
  onValueChange,
  large = false,
  prefix = 'Rp',
  className,
  ...props
}: MoneyInputProps) {
  return (
    <div className="relative">
      <span
        className={cn(
          'pointer-events-none absolute top-0 left-3 flex items-center font-medium text-muted',
          large ? 'h-14 text-lg' : 'h-11',
        )}
        aria-hidden="true"
      >
        {prefix}
      </span>
      <input
        {...props}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={value === null ? '' : formatRupiah(value, { prefix: false })}
        onChange={(e) => onValueChange(parseRupiahInput(e.target.value))}
        className={cn(controlClasses, 'pl-10 font-medium', large && 'h-14 text-[22px]', className)}
      />
    </div>
  );
}
