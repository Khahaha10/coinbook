import type { SummaryReportDto } from '@coinbook/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useSummaryReport(month: string) {
  return useQuery({
    queryKey: qk.reports.summary(month),
    queryFn: () => api<SummaryReportDto>('/reports/summary', { query: { month } }),
  });
}
