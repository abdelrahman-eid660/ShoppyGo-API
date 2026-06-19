import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailService } from '../service';
import { VerifyOTPTemplate } from '../templates';
import type { SendOTPEventPayload } from '../types';
@Injectable()
export class MailListener {
  constructor(
    private readonly mailService: MailService,
    private readonly verifyOtpTemplate: VerifyOTPTemplate
  ) {}

  @OnEvent('SEND_OTP')
  async handleSendOTP(payload: SendOTPEventPayload) {
    const { to, code, subject, title, expiredTime } = payload;
    await this.mailService.sendMail({
      to,
      subject,
      html: this.verifyOtpTemplate.verifyOTPTemplate({
        code,
        title,
        expiredTime,
      }),
    });
  }
}
