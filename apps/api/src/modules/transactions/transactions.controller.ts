import {
  Body,
  Controller,
  Delete,
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
  createTransactionSchema,
  idSchema,
  listTransactionsQuerySchema,
  recentTransactionsQuerySchema,
  updateTransactionSchema,
  type CreateTransactionInput,
  type ListTransactionsQuery,
  type Paginated,
  type RecentTransactionsQuery,
  type TransactionDto,
  type UpdateTransactionInput,
} from '@coinbook/shared';
import type { AuthUser } from '../../common/auth/auth-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(listTransactionsQuerySchema)) query: ListTransactionsQuery,
  ): Promise<Paginated<TransactionDto>> {
    return this.transactions.list(user.id, query);
  }

  @Get('recent')
  recent(
    @CurrentUser() user: AuthUser,
    @Query(new ZodValidationPipe(recentTransactionsQuerySchema)) query: RecentTransactionsQuery,
  ): Promise<TransactionDto[]> {
    return this.transactions.recent(user.id, query.limit);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createTransactionSchema)) body: CreateTransactionInput,
  ): Promise<TransactionDto> {
    return this.transactions.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateTransactionSchema)) body: UpdateTransactionInput,
  ): Promise<TransactionDto> {
    return this.transactions.update(user.id, id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<void> {
    return this.transactions.remove(user.id, id);
  }
}
