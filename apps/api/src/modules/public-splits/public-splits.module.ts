import { Module } from '@nestjs/common';
import { PublicSplitsController } from './public-splits.controller';
import { PublicSplitsService } from './public-splits.service';

@Module({
  controllers: [PublicSplitsController],
  providers: [PublicSplitsService],
})
export class PublicSplitsModule {}
