import { Module } from '@nestjs/common';
import { AuthenticationController } from './authentication.controller';
import { AuthenticationService } from './authentication.service';
import { MailListener } from 'src/common/listener';
import { VerifyOTPTemplate } from 'src/common/templates';
import {
  MailService,
  OTPService,
} from 'src/common/service';
import { SecurityModule } from 'src/common/service/security';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports: [SharedAuthenticationModule, SecurityModule],
  exports: [],
  controllers: [AuthenticationController],
  providers: [
    AuthenticationService,
    MailListener,
    VerifyOTPTemplate,
    MailService,
    OTPService,
  ],
})
export class AuthenticationModule {}
