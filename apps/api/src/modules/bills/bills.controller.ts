import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createBillSchema,
  idSchema,
  updateBillSchema,
  type BillDto,
  type BillListDto,
  type CreateBillInput,
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

  @Post(':id/deactivate')
  @HttpCode(HttpStatus.OK)
  deactivate(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<BillDto> {
    return this.bills.deactivate(user.id, id);
  }
}
