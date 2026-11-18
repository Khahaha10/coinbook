import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  createSplitSchema,
  idSchema,
  type CreateSplitInput,
  type SplitDetailDto,
  type SplitListDto,
} from '@coinbook/shared';
import type { AuthUser } from '../../common/auth/auth-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { SplitsService } from './splits.service';

@ApiTags('splits')
@ApiBearerAuth()
@Controller('splits')
export class SplitsController {
  constructor(private readonly splits: SplitsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser): Promise<SplitListDto> {
    return this.splits.list(user.id);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(createSplitSchema)) body: CreateSplitInput,
  ): Promise<SplitDetailDto> {
    return this.splits.create(user.id, body);
  }

  @Get(':id')
  detail(
    @CurrentUser() user: AuthUser,
    @Param('id', new ZodValidationPipe(idSchema)) id: string,
  ): Promise<SplitDetailDto> {
    return this.splits.detail(user.id, id);
  }
}
