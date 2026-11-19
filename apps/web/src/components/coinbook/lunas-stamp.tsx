import { cn } from '@/lib/cn';

export interface LunasStampProps {
  size?: 'md' | 'sm';
  animate?: boolean;
  className?: string;
}

export function LunasStamp({ size = 'md', animate = false, className }: LunasStampProps) {
  return (
    <span
      className={cn('stamp', size === 'sm' && 'sm', animate && 'anim', className)}
      aria-hidden="true"
    >
      LUNAS
    </span>
  );
}
