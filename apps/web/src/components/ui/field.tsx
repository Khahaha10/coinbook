import { CalendarDays, CircleAlert } from 'lucide-react';
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export const controlClasses =
  'h-11 w-full rounded-control border border-rule bg-paper px-3 text-[15px] text-text transition-[border-color] duration-150 hover:border-rule-strong focus:border-ink-700 focus:outline-2 focus:outline-offset-2 focus:outline-ink-700 aria-invalid:border-expense disabled:cursor-not-allowed disabled:opacity-60';

export interface FieldProps {
  label: string;
  htmlFor?: string;
  labelAs?: 'label' | 'span';
  hint?: ReactNode;
  hintId?: string;
  error?: string;
  errorId?: string;
  className?: string;
  children: ReactNode;
}

export function Field({
  label,
  htmlFor,
  labelAs = 'label',
  hint,
  hintId,
  error,
  errorId,
  className,
  children,
}: FieldProps) {
  const Label = labelAs;
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label
        htmlFor={labelAs === 'label' ? htmlFor : undefined}
        className="text-[13px] font-medium text-text"
      >
        {label}
      </Label>
      {children}
      {error ? (
        <span id={errorId} className="flex items-center gap-1.5 text-[13px] text-overdue-text">
          <CircleAlert size={16} aria-hidden="true" />
          {error}
        </span>
      ) : null}
      {hint && !error ? (
        <span id={hintId} className="text-[13px] text-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
}

export function Input({ icon, className, ...props }: InputProps) {
  if (!icon) return <input className={cn(controlClasses, className)} {...props} />;
  return (
    <div className="relative">
      <span
        className="pointer-events-none absolute top-3 left-3 flex text-muted"
        aria-hidden="true"
      >
        {icon}
      </span>
      <input className={cn(controlClasses, 'pl-10', className)} {...props} />
    </div>
  );
}

const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236B6F8A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

export function Select({ className, style, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        controlClasses,
        'appearance-none bg-[length:18px] bg-[position:right_10px_center] bg-no-repeat pr-9',
        className,
      )}
      style={{ backgroundImage: CHEVRON, ...style }}
      {...props}
    />
  );
}

export function DateInput({ className, onClick, ...props }: Omit<InputProps, 'type' | 'icon'>) {
  return (
    <Input
      {...props}
      type="date"
      icon={<CalendarDays size={18} />}
      onClick={(e) => {
        onClick?.(e);
        try {
          e.currentTarget.showPicker();
        } catch {
          return;
        }
      }}
      className={cn('[&::-webkit-calendar-picker-indicator]:hidden', className)}
    />
  );
}
