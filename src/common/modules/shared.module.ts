import { UserModel } from 'src/DB/models';
import { CacheService, TokenService } from '../service';
import { createClient } from 'redis';
import { UserRepository } from 'src/DB/Repository';
import { JwtService } from '@nestjs/jwt';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TranslationService } from 'src/common/service';

@Module({
  imports: [UserModel],
  exports: [
    'REDIS_CLIENT',
    TokenService,
    JwtService,
    CacheService,
    UserRepository,
    TranslationService,
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
  ],
})
export class SharedAuthenticationModule {}
