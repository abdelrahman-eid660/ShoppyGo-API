import { Controller, Get, Param, Query, UseInterceptors } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { Auth, CacheKey, User } from 'src/common/decorator';
import { Types } from 'mongoose';
import { AllNotificationsDTO } from './dto';
import { INotification, IPagination } from 'src/common/interface';
import { CacheKeyEnum } from 'src/common/enum';
import { CustomeCacheInterceptor } from 'src/common/interceptor';
import type{ HUserDocument } from 'src/DB/models';

@Auth({})
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}
  @Get('all-notifications')
  async findAll(@Query() query : AllNotificationsDTO , @User() user : HUserDocument) : Promise<IPagination<INotification>> {
    return await this.notificationsService.findAll(query , user);
  }

  @UseInterceptors(CustomeCacheInterceptor)
  @CacheKey(CacheKeyEnum.NOTIFICATION)
  @Get(':notificationId')
  async findOne(@Param('notificationId') notificationId: Types.ObjectId , @User() user : HUserDocument): Promise<INotification> {
    return await this.notificationsService.findOne(notificationId , user);
  }
}
