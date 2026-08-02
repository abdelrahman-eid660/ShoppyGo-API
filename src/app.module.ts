import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { join } from 'node:path';
import { I18nModule } from 'nestjs-i18n';
import { S3Service } from './common/service';
import { AuthenticationGuard } from './common/guard';
import { SharedAuthenticationModule } from './common/modules';
import { ResponseInterceptor } from './common/interceptor';
import {ScheduleModule} from '@nestjs/schedule'
import {
  AuthenticationModule,
  BrandModule,
  CategoryModule,
  ProductModule,
  UserModule,
  ProductVariantModule,
  InventoryModule,
  ProductSupplierModule,
  SupplierModule,
  PurchaseProductsModule,
  WarehouseModule,
  BrandSupplierModule,
  WarehouseTransformModule,
  StockAdjustmentModule,
  InventoryMovementModule,
  CartModule,
  CouponModule,
  OrderModule,
  ShippingZoneModule,
  PaymentModule,
  WishlistModule,
  AuditlogModule,
  SettingsModule,
  ReviewModule,
  RealtimeModule,
  StockAlertModule,
  NotificationsModule,
  FinancialReviewModule,
  AnalyticsModule,
} from './modules';
import { CacheModule } from '@nestjs/cache-manager';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { FCMModule } from './common/service/notification';
import { APP_GUARD } from '@nestjs/core';
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl : 60000,
        limit : 100
      }
    ]),
    SharedAuthenticationModule,
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      envFilePath: ['.env.development', '.env.production'],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DB_URI'),
        onConnectionCreate: (connection: Connection) => {
          connection.on('connected', () =>
            console.log(`DB Connected successfuly✅ ✅`)
          );
          connection.on('open', () =>
            console.log('DB Connection is opened 🌞')
          );
          connection.on('disconnected', () => console.log('disconnected ❌🤒'));
          connection.on('reconnected', () => console.log('reconnected ⏳'));
          connection.on('disconnecting', () =>
            console.log('disconnecting 🙆‍♂️😨')
          );
        },
      }),
      inject: [ConfigService],
    }),
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: join(__dirname, '/i18n/'),
        watch: true,
      },
    }),
     GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile : join(process.cwd(), 'src/schema.gel'),
      graphiql : true
    }),
    CacheModule.register({
      isGlobal: true,
      ttl: 10000,
    }),
    ScheduleModule.forRoot(),
    AuthenticationModule,
    UserModule,
    BrandModule,
    CategoryModule,
    ProductModule,
    ProductVariantModule,
    InventoryModule,
    SupplierModule,
    ProductSupplierModule,
    PurchaseProductsModule,
    WarehouseModule,
    BrandSupplierModule,
    WarehouseTransformModule,
    StockAdjustmentModule,
    InventoryMovementModule,
    CartModule,
    CouponModule,
    OrderModule,
    ShippingZoneModule,
    PaymentModule,
    WishlistModule,
    AuditlogModule,
    SettingsModule,
    ReviewModule,
    RealtimeModule,
    StockAlertModule,
    NotificationsModule,
    FCMModule,
    FinancialReviewModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
  providers: [AppService, S3Service, AuthenticationGuard, ResponseInterceptor , {provide : APP_GUARD , useClass : ThrottlerGuard}],
})
export class AppModule {}
