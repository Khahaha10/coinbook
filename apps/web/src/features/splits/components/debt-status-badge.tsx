import type { DebtStatus } from '@coinbook/shared';
import { Badge } from '@/components/ui/badge';

export function DebtStatusBadge({ status }: { status: DebtStatus }) {
  if (status === 'PAID') return <Badge variant="paid">Lunas</Badge>;
  if (status === 'PENDING') return <Badge variant="waiting">Menunggu konfirmasi</Badge>;
  return <Badge variant="unpaid">Belum bayar</Badge>;
}
