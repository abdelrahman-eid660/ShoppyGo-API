import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { UserModel } from 'src/DB/models';
import { UserRepository } from 'src/DB/Repository';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';
import { MailListener } from 'src/common/listener';
import { VerifyOTPTemplate } from 'src/common/templates';
import {
  MailService,
  OTPService,
  CacheService,
  NotificationService,
  FCMRedisService,
} from 'src/common/service';
import { SecurityModule } from 'src/common/service/security';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports: [SharedAuthenticationModule, SecurityModule],
  exports: [],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    FCMRedisService,
    MailListener,
    VerifyOTPTemplate,
    MailService,
    OTPService,
    NotificationService,
  ],
})
export class AuthenticationModule {}
