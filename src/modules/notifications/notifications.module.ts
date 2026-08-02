import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationModel } from 'src/DB/models';
import { SharedAuthenticationModule } from 'src/common/modules';
import { NotificationRepository } from 'src/DB/Repository';
import { RealtimeGetway } from '../realtime';
import { FCMService } from 'src/common/service';

@Module({
  imports : [NotificationModel , SharedAuthenticationModule],
  controllers: [NotificationsController],
  exports:[NotificationsService],
  providers: [NotificationsService , NotificationRepository , RealtimeGetway , FCMService],
})
export class NotificationsModule {}
