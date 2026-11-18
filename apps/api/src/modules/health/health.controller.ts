import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { AppError } from '../../common/errors/app-error';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check(): Promise<{ ok: true }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      throw new AppError(
        'INTERNAL_ERROR',
        'Database unreachable',
        undefined,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
    return { ok: true };
  }
}
