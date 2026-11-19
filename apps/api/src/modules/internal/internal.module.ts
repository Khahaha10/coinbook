import { Module } from '@nestjs/common';
import { BillRemindersService } from './bill-reminders.service';
import { CronController } from './cron.controller';

@Module({
  controllers: [CronController],
  providers: [BillRemindersService],
})
export class InternalModule {}
