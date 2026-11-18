import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppError } from '../../common/errors/app-error';
import { PrismaService } from '../../database/prisma.service';

@ApiTags('health')
@SkipThrottle()
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
