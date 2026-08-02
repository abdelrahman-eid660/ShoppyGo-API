import { Global, Module } from '@nestjs/common';
import { FCMService } from './notification.service';

@Global()
@Module({
  providers: [FCMService],
  exports: [FCMService],
})
export class FCMModule {}
