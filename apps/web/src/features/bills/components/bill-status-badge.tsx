import type { BillDto } from '@coinbook/shared';
import { Badge } from '@/components/ui/badge';

export function BillStatusBadge({ bill }: { bill: Pick<BillDto, 'status' | 'daysUntilDue'> }) {
  if (bill.status === 'PAID') return <Badge variant="paid">Lunas</Badge>;
  if (bill.status === 'OVERDUE') {
    return <Badge variant="overdue">Terlambat {-bill.daysUntilDue} hari</Badge>;
  }
  if (bill.daysUntilDue === 0) return <Badge variant="due">Jatuh tempo hari ini</Badge>;
  return <Badge variant="due">Jatuh tempo H-{bill.daysUntilDue}</Badge>;
}
