import type {
  BillCalendarDto,
  BillDto,
  BillListDto,
  BillPaymentDto,
  CreateBillInput,
} from '@coinbook/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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

export function useCreateBill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateBillInput) => api<BillDto>('/bills', { method: 'POST', body: input }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.bills.all }),
        queryClient.invalidateQueries({ queryKey: qk.reports.all }),
      ]),
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
