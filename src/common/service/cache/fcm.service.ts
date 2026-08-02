import { Injectable } from '@nestjs/common';
import { CacheService } from './cache.service';
import { Types } from 'mongoose';

@Injectable()
export class FCMRedisService {
  constructor(private readonly client: CacheService) {}
  //===================== Notification ====================
  FCM_Key(userId: Types.ObjectId | string) {
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    return `user:FCM:${userId}`;
  }
  async addFCM(userId: Types.ObjectId | string, FCMToken: string) {
    return await this.client.sAdd(this.FCM_Key(userId), FCMToken);
  }
  async removeFCM(userId: Types.ObjectId | string, FCMToken: string) {
    return await this.client.sRem(this.FCM_Key(userId), FCMToken);
  }
  async getFCMs(userId: Types.ObjectId | string) {
    return await this.client.sMembers(this.FCM_Key(userId));
  }
  async hasFCMs(userId: Types.ObjectId | string) {
    return await this.client.sCard(this.FCM_Key(userId));
  }
  async removeFCMUser(userId: Types.ObjectId | string) {
    return await this.client.deleteKey(this.FCM_Key(userId));
  }
  async getFCMsMulti(users: (Types.ObjectId | string)[]) {
    const multi = this.client.multi();
    for (const id of users) {
      multi.sMembers(this.FCM_Key(id.toString()));
    }
    const results = await multi.exec();
    return (results as unknown as string[][]).flat();
  }
}
