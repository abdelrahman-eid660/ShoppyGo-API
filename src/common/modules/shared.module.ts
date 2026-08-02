import { NotificationModel, ProductVariantModel, StockAlertModel, UserModel } from 'src/DB/models';
import { CacheService, FCMRedisService, FCMService, TokenService } from '../service';
import { createClient } from 'redis';
import { NotificationRepository, ProductVariantRepository, StockAlertRepository, UserRepository } from 'src/DB/Repository';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranslationService } from 'src/common/service';
import { NotificationsListener, StockAlertListener } from '../listener';
import { RealtimeGetway } from 'src/modules/realtime';

@Module({
  imports: [UserModel , NotificationModel , StockAlertModel , ProductVariantModel],
  exports: [
    'REDIS_CLIENT',
    TokenService,
    JwtService,
    CacheService,
    UserRepository,
    TranslationService,
    StockAlertRepository,
    NotificationRepository,
    NotificationsListener,
    RealtimeGetway,
    StockAlertListener,
    FCMRedisService,
    FCMService,
    ProductVariantRepository
  ],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const client = createClient({
          url: configService.get<string>('REDIS_URI'),
        });
        client.on('error', (err) => console.error(`Redis Client Error`, err));
        await client.connect();
        console.log(`Redis connected Successfuly ✅`);
        return client;
      },
      inject: [ConfigService],
    },
    UserRepository,
    CacheService,
    TokenService,
    JwtService,
    TranslationService,
    StockAlertRepository,
    NotificationRepository,
    NotificationsListener,
    RealtimeGetway,
    StockAlertListener,
    FCMService,
    FCMRedisService,
    ProductVariantRepository
  ],
})
export class SharedAuthenticationModule {}
