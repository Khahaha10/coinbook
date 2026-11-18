import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { updateMeSchema, type MeDto, type UpdateMeInput } from '@coinbook/shared';
import type { AuthUser } from '../../common/auth/auth-user';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { MeService } from './me.service';

@ApiTags('me')
@ApiBearerAuth()
@Controller('me')
export class MeController {
  constructor(private readonly me: MeService) {}

  @Post('bootstrap')
  @HttpCode(HttpStatus.OK)
  bootstrap(@CurrentUser() user: AuthUser): Promise<MeDto> {
    return this.me.bootstrap(user);
  }

  @Get()
  get(@CurrentUser() user: AuthUser): Promise<MeDto> {
    return this.me.get(user.id);
  }

  @Patch()
  update(
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(updateMeSchema)) body: UpdateMeInput,
  ): Promise<MeDto> {
    return this.me.update(user.id, body);
  }
}
