import { Module } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AnalyticsResolver } from './analytics.resolver';
import { OrderModel } from 'src/DB/models';
import { OrderRepository } from 'src/DB/Repository';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports : [OrderModel , SharedAuthenticationModule],
  providers: [AnalyticsResolver , OrderRepository, AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
