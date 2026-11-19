import type { CategoryDto } from '@coinbook/shared';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useCategories() {
  return useQuery({ queryKey: qk.categories.all, queryFn: () => api<CategoryDto[]>('/categories') });
}
