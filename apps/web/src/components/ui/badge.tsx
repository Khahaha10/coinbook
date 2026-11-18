import { Bell, Check, Circle, CircleAlert, Clock, type LucideIcon } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type BadgeVariant = 'due' | 'overdue' | 'paid' | 'waiting' | 'unpaid';

const STYLES: Record<BadgeVariant, { className: string; icon: LucideIcon }> = {
  due: { className: 'bg-warning-bg text-warning-text', icon: Bell },
  overdue: { className: 'bg-overdue-bg text-overdue-text', icon: CircleAlert },
  paid: { className: 'bg-tag-bg text-tag-text', icon: Check },
  waiting: { className: 'bg-warning-bg text-warning-text', icon: Clock },
  unpaid: {
    className: 'bg-transparent text-muted shadow-[inset_0_0_0_1px_var(--rule-strong)]',
    icon: Circle,
  },
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant: BadgeVariant;
  children: ReactNode;
}

export function Badge({ variant, className, children, ...props }: BadgeProps) {
  const { className: tone, icon: Icon } = STYLES[variant];
  return (
    <span
      {...props}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full pr-2.5 pl-2 text-[13px] leading-none font-medium whitespace-nowrap',
        tone,
        className,
      )}
    >
      <Icon size={16} aria-hidden="true" />
      {children}
    </span>
  );
}

export function Tag({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        'inline-flex h-5 items-center rounded-full bg-tag-bg px-2 align-[2px] text-xs leading-none font-medium whitespace-nowrap text-tag-text',
        className,
      )}
    />
  );
}

export interface PanelProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section' | 'aside';
  padded?: boolean;
}

export function Panel({ as: Component = 'div', padded = true, className, ...props }: PanelProps) {
  return (
    <Component
      {...props}
      className={cn('rounded-paper bg-paper shadow-paper', padded && 'p-5', className)}
    />
  );
}
