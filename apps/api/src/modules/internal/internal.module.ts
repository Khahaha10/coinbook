import { Module } from '@nestjs/common';
import { BillRemindersService } from './bill-reminders.service';
import { CronController } from './cron.controller';
import { DemoCleanupService } from './demo-cleanup.service';

@Module({
  controllers: [CronController],
  providers: [BillRemindersService, DemoCleanupService],
})
export class InternalModule {}
