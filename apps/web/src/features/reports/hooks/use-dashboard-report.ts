import type { DashboardReportDto } from '@coinbook/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useDashboardReport() {
  return useQuery({
    queryKey: qk.reports.dashboard,
    queryFn: () => api<DashboardReportDto>('/reports/dashboard'),
  });
}
