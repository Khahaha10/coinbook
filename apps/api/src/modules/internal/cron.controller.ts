import { Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { CronSecretGuard } from '../../common/guards/cron-secret.guard';
import { BillRemindersService, type ReminderRunResult } from './bill-reminders.service';

@ApiExcludeController()
@Public()
@UseGuards(CronSecretGuard)
@Controller('internal/cron')
export class CronController {
  constructor(private readonly reminders: BillRemindersService) {}

  @Post('bill-reminders')
  @HttpCode(HttpStatus.OK)
  billReminders(): Promise<ReminderRunResult> {
    return this.reminders.run();
  }
}
