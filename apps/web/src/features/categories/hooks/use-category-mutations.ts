import type { CategoryDto, CreateCategoryInput, UpdateCategoryInput } from '@coinbook/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

function invalidate(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: qk.categories.all }),
    queryClient.invalidateQueries({ queryKey: qk.transactions.all }),
    queryClient.invalidateQueries({ queryKey: qk.reports.all }),
    queryClient.invalidateQueries({ queryKey: qk.bills.all }),
  ]);
}

export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) => api<CategoryDto>('/categories', { method: 'POST', body: input }),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateCategoryInput }) =>
      api<CategoryDto>(`/categories/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => invalidate(queryClient),
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/categories/${id}`, { method: 'DELETE' }),
    onSuccess: () => invalidate(queryClient),
  });
}
