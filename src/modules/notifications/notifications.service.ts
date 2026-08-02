/* eslint-disable @typescript-eslint/no-floating-promises */
import { Injectable, NotFoundException } from '@nestjs/common';
import { CacheService, FCMService } from 'src/common/service';
import { RealtimeGetway } from '../realtime';
import { NotificationRepository } from 'src/DB/Repository';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { INotification, IPagination, ISendToPermissionNotification, ISendToRoleNotification, ISendToUserNotification } from 'src/common/interface';
import { Types } from 'mongoose';
import { AllNotificationsDTO } from './dto';
import { RoleEnum, SharedSortEnum, SortEnum } from 'src/common/enum';
import { HUserDocument } from 'src/DB/models';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly realtimeGateway: RealtimeGetway,
    private readonly fcmService: FCMService,
    private readonly redis: CacheService,
  ) {}

  async findAll(query : AllNotificationsDTO , user : HUserDocument):Promise<IPagination<INotification>> {
      const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , isRead , referenceModel , type} = query || {};
      const sortOption = SharedSortEnum[sort] || SharedSortEnum[SortEnum.NEWEST]
      const notifications = await this.notificationRepository.paginate({
          filter : {...(isRead) && {isRead} , ...(referenceModel) && {referenceModel} , ...(type) && {type} , recipientId : user._id}
          , page , limit , sort : sortOption , projection : "type body title createdAt"
      })
      return notifications
  }

  async findOne(notificationId: Types.ObjectId , user : HUserDocument): Promise<INotification> {
    const notification = await this.notificationRepository.findOneAndUpdate({filter : {_id : notificationId ,recipientId : user._id} ,
      options:{projection : "createdAt referenceId referenceModel isRead type body title" , populate : [{path : "referenceId"}]},update:{$set : {isRead : true}}
    })
    if (!notification) {
      throw new NotFoundException(`Notification not found or expired`)
    }
    return notification
  }
  
  async sendToUser(params: ISendToUserNotification) : Promise<INotification> {
    const notification = await this.notificationRepository.create({
      data: {
        recipientId: TransformToObjectId(params.recipientId),
        senderId: params.senderId ? TransformToObjectId(params.senderId) : undefined,
        title: params.title,body: params.body,type: params.type,
        referenceId: TransformToObjectId(params.referenceId),referenceModel: params.referenceModel,
        isRead: false, isSystem: params.isSystem ?? true,
      },
    });

    this.realtimeGateway.sendToUser(params.recipientId, 'new_notification', notification);
    const fcmTokens = await this.redis.getFCMs(params.recipientId);
    if (fcmTokens.length > 0) {
      await this.fcmService.sendNotifications({tokens : fcmTokens,  data : {title : params.title, body :  params.body as string}});
    }
    if (params.fcmToken) {
      await this.fcmService.sendNotification({token :  params.fcmToken, data :{title :  params.title, body : typeof params.body === 'string' ? params.body : 'لديك إشعار جديد'}});
    }
    return notification;
  }

  async sendToRole(params: ISendToRoleNotification):Promise<void>{
    const notificationsData = params.recipientsUserIds.map((userId) => ({
      recipientId: TransformToObjectId(userId), title: params.title,
      body: params.body, type: params.type,
      referenceId: TransformToObjectId(params.referenceId),
      referenceModel: params.referenceModel,
      isRead: false, isSystem: true,
    }));

    await this.notificationRepository.create({ data: notificationsData });
    this.realtimeGateway.sendToRole(params.role, 'new_notification', {
      title: params.title, body: params.body,
      type: params.type, referenceId: params.referenceId,
    });
    const fcmTokens = await this.redis.getFCMsMulti(params.recipientsUserIds);
    if (fcmTokens.length > 0) {
      await this.fcmService.sendNotifications({tokens : fcmTokens,  data : {title : params.title, body :  params.body}});
    }
  }

  async sendToPermission(params: ISendToPermissionNotification):Promise<void> {
    const notificationsData = params.recipientsUserIds.map((userId) => ({
      recipientId: TransformToObjectId(userId),
      title: params.title, body: params.body,
      type: params.type, referenceId: TransformToObjectId(params.referenceId),
      referenceModel: params.referenceModel,isRead: false,isSystem: true,
    }));
    await this.notificationRepository.create({ data: notificationsData });
    this.realtimeGateway.sendToPermission(params.permission, 'new_notification', {
      title: params.title, body: params.body, type: params.type, referenceId: params.referenceId,
    });
    const fcmTokens = await this.redis.getFCMsMulti(params.recipientsUserIds);
    if (fcmTokens.length > 0) {
      await this.fcmService.sendNotifications({tokens : fcmTokens,  data : {title : params.title, body :  params.body}});
    }
  }
}
