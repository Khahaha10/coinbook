import { cn } from '@/lib/cn';

export type CoinSize = 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<CoinSize, string> = { sm: 'dot', md: '', lg: 'lg', xl: 'xl' };

export interface CoinMarkProps {
  size?: CoinSize;
  ring?: boolean;
  className?: string;
}

export function CoinMark({ size = 'md', ring = false, className }: CoinMarkProps) {
  return (
    <span className={cn('coin', SIZE_CLASS[size], ring && 'ring', className)} aria-hidden="true">
      {size === 'sm' ? null : 'C'}
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('brand', className)}>
      <CoinMark />
      Coinbook
    </span>
  );
}
