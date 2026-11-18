import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  billCalendarQuerySchema,
  createBillSchema,
  idSchema,
  payBillSchema,
  updateBillSchema,
  type BillCalendarDto,
  type BillCalendarQuery,
  type BillDto,
  type BillListDto,
  type BillPaymentDto,
  type CreateBillInput,
  type PayBillInput,
  type UpdateBillInput,
} from '@coinbook/shared';
import type { AuthUser } from '../../common/auth/auth-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { BillsService } from './bills.service';

@ApiTags('bills')
@ApiBearerAuth()
@Controller('bills')
export class BillsController {
  constructor(private readonly bills: BillsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<BillListDto> {
    return this.bills.list(user.id);
  }

  @Get('calendar')
  calendar(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(billCalendarQuerySchema)) query: BillCalendarQuery,
  ): Promise<BillCalendarDto> {
    return this.bills.calendar(user.id, query.month);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createBillSchema)) body: CreateBillInput,
  ): Promise<BillDto> {
    return this.bills.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateBillSchema)) body: UpdateBillInput,
  ): Promise<BillDto> {
    return this.bills.update(user.id, id, body);
  }

  @Post(':id/pay')
  @HttpCode(HttpStatus.OK)
  pay(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(payBillSchema)) body: PayBillInput,
  ): Promise<BillDto> {
    return this.bills.pay(user.id, id, body);
  }

  @Get(':id/payments')
  payments(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<BillPaymentDto[]> {
    return this.bills.payments(user.id, id);
  }

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<BillDto> {
    return this.bills.deactivate(user.id, id);
  }
}
