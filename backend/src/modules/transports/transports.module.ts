import { Module } from '@nestjs/common';
import { TransportsService } from './transports.service';
import { TransportsController } from './transports.controller';

@Module({
  providers: [TransportsService],
  controllers: [TransportsController],
})
export class TransportsModule {}
