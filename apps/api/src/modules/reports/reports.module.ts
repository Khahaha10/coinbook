import { Module } from '@nestjs/common';
import { BillsModule } from '../bills/bills.module';
import { SplitsModule } from '../splits/splits.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [BillsModule, SplitsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
