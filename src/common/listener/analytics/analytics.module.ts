import { Module } from '@nestjs/common';
import { AnalyticsListener } from './analytics.listener';
import { AnalyticsModule } from 'src/modules';

@Module({
  imports: [AnalyticsModule],
  providers: [AnalyticsListener],
  exports: [AnalyticsListener],
})
export class AnalyticsListenerModule {}
