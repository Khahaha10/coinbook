import type {
  BillCalendarDto,
  BillDto,
  BillListDto,
  BillPaymentDto,
  CreateBillInput,
  UpdateBillInput,
} from '@coinbook/shared';
import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { qk } from '@/lib/api/query-keys';

export function useBills() {
  return useQuery({ queryKey: qk.bills.list, queryFn: () => api<BillListDto>('/bills') });
}

export function useBillCalendar(month: string) {
  return useQuery({
    queryKey: qk.bills.calendar(month),
    queryFn: () => api<BillCalendarDto>('/bills/calendar', { query: { month } }),
  });
}

export function useBillPayments(id: string | null) {
  return useQuery({
    queryKey: qk.bills.payments(id ?? ''),
    queryFn: () => api<BillPaymentDto[]>(`/bills/${id}/payments`),
    enabled: id !== null,
  });
}

function invalidateBills(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: qk.bills.all }),
    queryClient.invalidateQueries({ queryKey: qk.reports.all }),
  ]);
}

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBillInput) => api<BillDto>('/bills', { method: 'POST', body: input }),
    onSuccess: () => invalidateBills(queryClient),
  });
}

export function useUpdateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateBillInput }) =>
      api<BillDto>(`/bills/${id}`, { method: 'PATCH', body: input }),
    onSuccess: () => invalidateBills(queryClient),
  });
}

export function useDeactivateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<BillDto>(`/bills/${id}/deactivate`, { method: 'POST' }),
    onSuccess: () => invalidateBills(queryClient),
  });
}

export function useMarkBillPaid() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bill: Pick<BillDto, 'id' | 'nextDueDate'>) =>
      api<BillDto>(`/bills/${bill.id}/pay`, { method: 'POST', body: { dueDate: bill.nextDueDate } }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.bills.all }),
        queryClient.invalidateQueries({ queryKey: qk.transactions.all }),
        queryClient.invalidateQueries({ queryKey: qk.wallets.all }),
        queryClient.invalidateQueries({ queryKey: qk.reports.all }),
      ]),
  });
}
