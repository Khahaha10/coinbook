import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { EnvModule } from './config/env.module';
import { PrismaModule } from './database/prisma.module';
import { HealthController } from './modules/health/health.controller';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}
