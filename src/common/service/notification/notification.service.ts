import { Injectable } from '@nestjs/common';
import { firebaseApp } from 'src/config/firebase.provider';

@Injectable()
export class FCMService {
  async sendNotification({
    token,
    data,
  }: {
    token: string;
    data: {
      title: string;
      body: string;
    };
  }) {
    return firebaseApp.messaging().send({
      token,
      data,
    });
  }

  async sendNotifications({tokens,data}: {tokens: string[] , data: {title: string,body: string}}) {
    return Promise.allSettled(tokens.map((token) =>this.sendNotification({token,data})))}
  }
