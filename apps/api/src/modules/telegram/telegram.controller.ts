import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import type { MeDto, TelegramLinkDto } from '@coinbook/shared';
import type { AuthUser } from '../../common/auth/auth-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { TelegramSecretGuard } from '../../common/guards/telegram-secret.guard';
import { TelegramService, telegramUpdateSchema } from './telegram.service';

@ApiTags('me')
@ApiBearerAuth()
@Controller()
export class TelegramController {
  constructor(private readonly telegram: TelegramService) {}

  @Post('me/telegram/link')
  @HttpCode(HttpStatus.OK)
  link(@CurrentUser() user: AuthUser): Promise<TelegramLinkDto> {
    return this.telegram.createLink(user.id);
  }

  @Delete('me/telegram')
  disconnect(@CurrentUser() user: AuthUser): Promise<MeDto> {
    return this.telegram.disconnect(user.id);
  }

  @ApiExcludeEndpoint()
  @Public()
  @SkipThrottle()
  @UseGuards(TelegramSecretGuard)
  @Post('internal/telegram/webhook')
  @HttpCode(HttpStatus.OK)
  async webhook(@Body() body: unknown): Promise<{ ok: true }> {
    const parsed = telegramUpdateSchema.safeParse(body);
    if (parsed.success) await this.telegram.handleUpdate(parsed.data);
    return { ok: true };
  }
}
