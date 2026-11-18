import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppExceptionFilter } from './common/filters/app-exception.filter';
import { SupabaseAuthGuard } from './common/guards/supabase-auth.guard';
import { UserThrottlerGuard } from './common/guards/user-throttler.guard';
import { EnvModule } from './config/env.module';
import { PrismaModule } from './database/prisma.module';
import { HealthController } from './modules/health/health.controller';
import { CategoriesModule } from './modules/categories/categories.module';
import { MeModule } from './modules/me/me.module';
import { WalletsModule } from './modules/wallets/wallets.module';

@Module({
  imports: [
    EnvModule,
    PrismaModule,
    MeModule,
    WalletsModule,
    CategoriesModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: SupabaseAuthGuard },
    { provide: APP_GUARD, useClass: UserThrottlerGuard },
    { provide: APP_FILTER, useClass: AppExceptionFilter },
  ],
})
export class AppModule {}
