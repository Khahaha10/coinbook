import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createWalletSchema,
  idSchema,
  transferSchema,
  updateWalletSchema,
  type CreateWalletInput,
  type TransferInput,
  type TransferResultDto,
  type UpdateWalletInput,
  type WalletDto,
  type WalletListDto,
} from '@coinbook/shared';
import type { AuthUser } from '../../common/auth/auth-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@ApiBearerAuth()
@Controller('wallets')
export class WalletsController {
  constructor(private readonly wallets: WalletsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<WalletListDto> {
    return this.wallets.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createWalletSchema)) body: CreateWalletInput,
  ): Promise<WalletDto> {
    return this.wallets.create(user.id, body);
  }

  @Post('transfer')
  transfer(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(transferSchema)) body: TransferInput,
  ): Promise<TransferResultDto> {
    return this.wallets.transfer(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
    @Body(new ZodValidationPipe(updateWalletSchema)) body: UpdateWalletInput,
  ): Promise<WalletDto> {
    return this.wallets.update(user.id, id, body);
  }

  @Post(':id/archive')
  @HttpCode(HttpStatus.OK)
  archive(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<WalletDto> {
    return this.wallets.archive(user.id, id);
  }
}
