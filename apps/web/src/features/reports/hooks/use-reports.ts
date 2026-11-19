import type { CategoryReportDto, TrendPointDto } from '@coinbook/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useCategoryReport(month: string) {
  return useQuery({
    queryKey: qk.reports.byCategory(month),
    queryFn: () => api<CategoryReportDto>('/reports/by-category', { query: { month } }),
  });
}

export function useTrend(months = 6) {
  return useQuery({
    queryKey: qk.reports.trend(months),
    queryFn: () => api<TrendPointDto[]>('/reports/trend', { query: { months } }),
  });
}
