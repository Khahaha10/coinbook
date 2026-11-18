import { Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import {
  publicPersonParamsSchema,
  publicSplitParamsSchema,
  type PublicSplitDto,
} from '@coinbook/shared';
import { Public } from '../../common/decorators/public.decorator';
import { AppError } from '../../common/errors/app-error';
import { PublicSplitsService } from './public-splits.service';

const PUBLIC_LIMIT = { default: { limit: 20, ttl: 60_000 } };

@ApiTags('public')
@Public()
@Throttle(PUBLIC_LIMIT)
@Controller('public/splits')
export class PublicSplitsController {
  constructor(private readonly publicSplits: PublicSplitsService) {}

  @Get(':token')
  get(@Param() params: Record<string, string>): Promise<PublicSplitDto> {
    const parsed = publicSplitParamsSchema.safeParse(params);
    if (!parsed.success) throw AppError.notFound('Split');
    return this.publicSplits.get(parsed.data.token);
  }

  @Post(':token/people/:personId/paid')
  @HttpCode(HttpStatus.OK)
  markPaid(@Param() params: Record<string, string>): Promise<PublicSplitDto> {
    const parsed = publicPersonParamsSchema.safeParse(params);
    if (!parsed.success) throw AppError.notFound('Split');
    return this.publicSplits.markPaid(parsed.data.token, parsed.data.personId);
  }
}
