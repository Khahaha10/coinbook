import { Inject, Injectable } from '@nestjs/common';
import {
  fromDateOnly,
  monthOf,
  monthRange,
  shiftMonth,
  UNCATEGORIZED_ICON,
  UNCATEGORIZED_NAME,
  type CategoryReportDto,
  type DashboardReportDto,
  type MonthTotalsDto,
  type SummaryReportDto,
  type TrendPointDto,
} from '@coinbook/shared';
import { businessToday } from '../../common/clock';
import { ENV, type Env } from '../../config/env';
import { PrismaService } from '../../database/prisma.service';
import { BillsService } from '../bills/bills.service';
import { SplitsService } from '../splits/splits.service';

const UPCOMING_BILLS = 3;

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(ENV) private readonly env: Env,
    private readonly bills: BillsService,
    private readonly splits: SplitsService,
  ) {}

  currentMonth(): string {
    return monthOf(businessToday(this.env));
  }

  async summary(userId: string, month: string): Promise<SummaryReportDto> {
    const [totals, wallets] = await Promise.all([
      this.monthTotals(userId, month),
      this.prisma.wallet.findMany({
        where: { userId, isArchived: false },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        select: { id: true, name: true, type: true, balance: true },
      }),
    ]);
    return { month, ...totals.totals, transfer: totals.transfer, wallets };
  }

  async byCategory(userId: string, month: string): Promise<CategoryReportDto> {
    const rows = await this.prisma.transaction.groupBy({
      by: ['categoryId'],
      where: { userId, type: 'EXPENSE', date: this.dateRange(month) },
      _sum: { amount: true },
    });
    const ids = rows.flatMap((r) => (r.categoryId ? [r.categoryId] : []));
    const categories = await this.prisma.category.findMany({
      where: { id: { in: ids }, userId },
      select: { id: true, name: true, icon: true },
    });
    const byId = new Map(categories.map((c) => [c.id, c]));
    const spend = rows
      .map((r) => {
        const c = r.categoryId ? byId.get(r.categoryId) : undefined;
        return {
          categoryId: c?.id ?? null,
          name: c?.name ?? UNCATEGORIZED_NAME,
          icon: c?.icon ?? UNCATEGORIZED_ICON,
          amount: r._sum.amount ?? 0,
        };
      })
      .sort((x, y) => y.amount - x.amount || x.name.localeCompare(y.name, 'id'));
    const total = spend.reduce((s, c) => s + c.amount, 0);
    const max = spend[0]?.amount ?? 0;
    return {
      month,
      total,
      categories: spend.map((c) => ({
        ...c,
        percentOfTotal: total ? Math.round((c.amount / total) * 100) : 0,
        relativeToMax: max ? c.amount / max : 0,
      })),
    };
  }

  async trend(userId: string, months: number): Promise<TrendPointDto[]> {
    const last = this.currentMonth();
    const first = shiftMonth(last, -(months - 1));
    const rows = await this.prisma.$queryRaw<{ month: string; type: string; total: bigint }[]>`
      SELECT to_char(date, 'YYYY-MM') AS month, type::text AS type, SUM(amount)::bigint AS total
      FROM "Transaction"
      WHERE "userId" = ${userId}::uuid
        AND type IN ('INCOME', 'EXPENSE')
        AND date >= ${monthRange(first).from}::date
        AND date <= ${monthRange(last).to}::date
      GROUP BY 1, 2`;
    const sums = new Map(rows.map((r) => [`${r.month}:${r.type}`, Number(r.total)]));
    return Array.from({ length: months }, (_, i) => {
      const month = shiftMonth(first, i);
      return {
        month,
        income: sums.get(`${month}:INCOME`) ?? 0,
        expense: sums.get(`${month}:EXPENSE`) ?? 0,
      };
    });
  }

  async dashboard(userId: string): Promise<DashboardReportDto> {
    const month = this.currentMonth();
    const [totals, bills, splits] = await Promise.all([
      this.monthTotals(userId, month),
      this.bills.list(userId),
      this.splits.list(userId),
    ]);
    return {
      month,
      summary: totals.totals,
      upcomingBills: bills.data.filter((b) => b.status !== 'PAID').slice(0, UPCOMING_BILLS),
      receivables: { total: splits.receivablesTotal, people: splits.receivables },
    };
  }

  private dateRange(month: string): { gte: Date; lte: Date } {
    const { from, to } = monthRange(month);
    return { gte: fromDateOnly(from), lte: fromDateOnly(to) };
  }

  private async monthTotals(
    userId: string,
    month: string,
  ): Promise<{ totals: MonthTotalsDto; transfer: number }> {
    const rows = await this.prisma.transaction.groupBy({
      by: ['type'],
      where: { userId, date: this.dateRange(month) },
      _sum: { amount: true },
    });
    const sum = (type: string): number => rows.find((r) => r.type === type)?._sum.amount ?? 0;
    const income = sum('INCOME');
    const expense = sum('EXPENSE');
    return { totals: { income, expense, net: income - expense }, transfer: sum('TRANSFER') };
  }
}
