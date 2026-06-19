import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  OTPSubjectEnum,
  OTPTitleEnum,
  RedisActionsEnum,
  RedisTypeEnum,
} from '../enum';
import { SecurityService } from './security';
import crypto from 'node:crypto';
import {
  GenerateOtpParams,
  KeyCheckParams,
  MaxRequestParams,
  VerifyOTP,
} from '../types';
import { CacheService } from './cache';
@Injectable()
export class OTPService {
  constructor(
    private readonly securityService: SecurityService,
    private readonly redis: CacheService,
    private readonly eventEmitter: EventEmitter2
  ) {}
  //================= Generate OTP =====================================
  generateOTP(length = 6): string {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += chars[crypto.randomInt(0, chars.length)];
    }
    return otp;
  }
  // ==================== Generate OTP & Send ====================
  async generateOtpAndSendOtpEmail({
    email,
    expiredTime = 1,
    title = OTPTitleEnum.CONFIRMEMAIL,
    subject = OTPSubjectEnum.VERIFYACCOUNT,
  }: GenerateOtpParams): Promise<void> {
    const code = this.generateOTP();
    const hashedCode = await this.securityService.generateHash(code);
    await this.redis.set({
      key: this.redis.RedisKey({ type: title, key: email }),
      value: hashedCode,
      ttl: expiredTime * 60,
    });
    this.eventEmitter.emit('SEND_OTP', {
      to: email,
      subject,
      code,
      title: subject,
      expiredTime,
    });
  }
  // ==================== Check if OTP Key Expired ====================
  async isKeyExpired({
    email,
    type = RedisTypeEnum.CONFIRMEMAIL,
  }: KeyCheckParams): Promise<void> {
    const remainingTime = await this.redis.ttl(
      this.redis.RedisKey({ type, key: email })
    );
    if (remainingTime > 0) {
      throw new BadRequestException(
        `لا يمكنك اعاده طلب كود حاليا برجاء انتظار ${remainingTime} ثانية حتي تتمكن من الطلب مجددا`,
        ''
      );
    }
  }
  // ==================== Max OTP Requests ====================
  async maxKeyRequest({
    email,
    type = RedisTypeEnum.CONFIRMEMAIL,
    action = RedisActionsEnum.REQUEST,
    blockAction,
    expiredTime = 5,
  }: MaxRequestParams): Promise<void> {
    const maxRequestKey = this.redis.RedisMaxRequestKey({
      type,
      key: email,
      action,
    });
    const blockKey = this.redis.RedisBlockKey({
      type,
      key: email,
      blockAction,
    });
    const currentRequest = await this.redis.get({ key: maxRequestKey });

    if (currentRequest) {
      await this.redis.incr(maxRequestKey);

      const newRequestCount =
        Number(await this.redis.get({ key: maxRequestKey })) || 0;

      if (newRequestCount > 5) {
        await this.redis.set({
          key: blockKey,
          value: 'true',
          ttl: expiredTime * 60,
        });
        await this.redis.deleteKey(maxRequestKey);

        const blockTTL = await this.redis.ttl(blockKey);

        throw new ConflictException(
          type === RedisTypeEnum.CONFIRMEMAIL
            ? `لا يمكنك طلب كود اخر برجاء انتظار ${blockTTL} ثانية `
            : `تم عمل بان للحسابك يمكنك المحاولة مجددا بعد ${blockTTL}`,
          ''
        );
      }
    } else {
      await this.redis.set({ key: maxRequestKey, value: 1 });
    }
  }
  // ==================== Check if Key Blocked ====================
  async isKeyBlocked({
    email,
    type = RedisTypeEnum.CONFIRMEMAIL,
    action = RedisActionsEnum.BLOCKREQUEST,
  }: KeyCheckParams): Promise<void> {
    const remainingBlock = await this.redis.ttl(
      this.redis.RedisBlockKey({ type, key: email, action })
    );
    if (remainingBlock > 0) {
      throw new ConflictException(
        `Your account has been blocked, please wait for ${remainingBlock} seconds`,
        ''
      );
    }
  }
  // ==================== Verify OTP ====================
  async verifyOTP({
    email,
    type = OTPTitleEnum.CONFIRMEMAIL,
    otp,
  }: VerifyOTP): Promise<void> {
    const hashedOTP = await this.redis.get({
      key: this.redis.RedisKey({
        type,
        key: email,
      }),
    });

    if (!hashedOTP) {
      throw new NotFoundException('Expired otp');
    }
    const checkOtp = await this.securityService.compareHash(otp, hashedOTP);
    if (!checkOtp) {
      throw new ConflictException('Invalid otp');
    }
    void this.redis.deleteKey(
      this.redis.RedisKey({
        type,
        key: email,
      })
    );
  }
}
