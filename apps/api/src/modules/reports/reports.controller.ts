import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  reportMonthQuerySchema,
  trendQuerySchema,
  type CategoryReportDto,
  type DashboardReportDto,
  type ReportMonthQuery,
  type SummaryReportDto,
  type TrendPointDto,
  type TrendQuery,
} from '@coinbook/shared';
import type { AuthUser } from '../../common/auth/auth-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { ReportsService } from './reports.service';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('dashboard')
  dashboard(@CurrentUser() user: AuthUser): Promise<DashboardReportDto> {
    return this.reports.dashboard(user.id);
  }

  @Get('summary')
  summary(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(reportMonthQuerySchema)) query: ReportMonthQuery,
  ): Promise<SummaryReportDto> {
    return this.reports.summary(user.id, query.month ?? this.reports.currentMonth());
  }

  @Get('by-category')
  byCategory(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(reportMonthQuerySchema)) query: ReportMonthQuery,
  ): Promise<CategoryReportDto> {
    return this.reports.byCategory(user.id, query.month ?? this.reports.currentMonth());
  }

  @Get('trend')
  trend(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(trendQuerySchema)) query: TrendQuery,
  ): Promise<TrendPointDto[]> {
    return this.reports.trend(user.id, query.months);
  }
}
