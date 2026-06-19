import { Module } from '@nestjs/common';
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
import { AuthenticationModule, BrandModule, CategoryModule, ProductModule, UserModule } from './modules';
import { IndexSyncModule } from './DB/indexs/syncIndexs.module';
@Module({
  imports: [
    IndexSyncModule,
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
    AuthenticationModule,
    UserModule,
    BrandModule,
    CategoryModule,
    ProductModule,
  ],
  controllers: [AppController],
  providers: [AppService , S3Service , AuthenticationGuard , ResponseInterceptor],
})
export class AppModule {}
