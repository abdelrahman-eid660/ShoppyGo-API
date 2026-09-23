import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import type {
  ConfirmOTPDTO,
  LoginDTO,
  ResendOTPDTO,
  ResetPasswordDTO,
  SignupDTO,
  SignWhitGoogleDTO,
} from './dto/authentication.dto';
import { UserRepository } from 'src/DB/Repository';
import {
  CacheService,
  FCMRedisService,
  FCMService,
  OTPService,
} from 'src/common/service';
import {
  AuthCodeResonse,
  OTPSubjectEnum,
  OTPTitleEnum,
  ProviderEnum,
  RedisActionsEnum,
  RedisTypeEnum,
} from 'src/common/enum';
import { SecurityService } from 'src/common/service/security';
import { TokenService } from 'src/common/service/token.service';
import { IGenerateToken } from 'src/common/interface';
import { OAuth2Client, TokenPayload } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthenticationService {
  private logger = new Logger()
  constructor(
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly FCMRedis: FCMRedisService,
    private readonly redis: CacheService,
    private readonly oTPService: OTPService,
    private readonly secuirtyService: SecurityService,
    private readonly fCMService: FCMService,
    private readonly tokenService: TokenService,
  ) {}
  private async verifyGoogleAccount({
    idToken,
  }: SignWhitGoogleDTO): Promise<TokenPayload> {
    const client = new OAuth2Client();
    const ticket = await client.verifyIdToken({
      idToken,
      audience: this.configService.get<string>('WEB_CLIENT_ID'),
    });
    const payload = ticket.getPayload();
    if (!payload?.email_verified) {
      throw new BadRequestException('Fail to verify this account with google');
    }
    return payload;
  }
  async signup(data: SignupDTO): Promise<string> {
    const userExist = await this.userRepository.findOne({
      filter: {
        email: data.email,
        confirmedAt: { $exists: false },
        provider: ProviderEnum.SYSTEM,
        deletedAt : {$exists : false}
      },
    });
    if (userExist) {
      throw new ConflictException('This account exists');
    }
    const user = await this.userRepository.create({ data });
    void this.oTPService.generateOtpAndSendOtpEmail({
      email: user.email,
      expiredTime: 1,
    }).catch(error => this.logger.error(error));
    return `Check from your gmail`;
  }
  async resendConfirmEmail({ email }: ResendOTPDTO): Promise<string> {
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmedAt: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!user) {
      throw new ConflictException('Fail to find matching account');
    }
    await this.oTPService.isKeyBlocked({
      email,
      type: RedisTypeEnum.CONFIRMEMAIL,
      blockAction: RedisActionsEnum.BLOCKREQUEST,
    });
    await this.oTPService.isKeyExpired({
      email,
      type: RedisTypeEnum.CONFIRMEMAIL,
    });
    await this.oTPService.maxKeyRequest({
      email,
      type: RedisTypeEnum.CONFIRMEMAIL,
      blockAction: RedisActionsEnum.BLOCKREQUEST,
      expiredTime: 5,
    });
    void this.oTPService.generateOtpAndSendOtpEmail({
      email,
      expiredTime: 2,
    }).catch(error => this.logger.error(error));
    return 'The code has been sent again, please check your email.';
  }
  async confirmEmail({ email, otp }: ConfirmOTPDTO): Promise<string> {
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmedAt: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!user) {
      throw new ConflictException('Fail to find matching account');
    }
    await this.oTPService.verifyOTP({
      email,
      type: OTPTitleEnum.CONFIRMEMAIL,
      otp,
    });
    user.confirmedAt = new Date();
    await user.save();
    return 'Confirm Email Successfuly';
  }
  async login( { email, password, FCM }: LoginDTO,issure: string,lang : string): Promise<IGenerateToken> {
    await this.oTPService.isKeyBlocked({email,type: RedisTypeEnum.LOGIN,action: RedisActionsEnum.BLOCKLOGIN});
    await this.oTPService.maxKeyRequest({
      email,
      type: RedisTypeEnum.LOGIN,
      blockAction: RedisActionsEnum.BLOCKLOGIN,
      expiredTime: 5,
    });
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmedAt: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!user) {
      throw new NotFoundException({code : AuthCodeResonse.userNotFound});
    }
    if (!(await this.secuirtyService.compareHash(password, user.password))) { 
      throw new BadRequestException({code : AuthCodeResonse.invalidCredentials})
    }
    if (FCM) {
      this.FCMRedis.FCM_Key(user._id);
      await this.FCMRedis.addFCM(user._id, FCM);
      const tokens = await this.FCMRedis.getFCMs(user._id);
      if (tokens?.length) {
        try {
          void this.fCMService.sendNotifications({
            tokens,
            data: {
              body: `New Login At ${new Date().toLocaleString()}`,
              title: 'Login',
            },
          });
        } catch (error) {
          console.log(`Notification error sending`, error);
        }
      }
    }
    void this.redis.deleteKey(
      this.redis.RedisKey({
        key: email,
        type: RedisTypeEnum.LOGIN,
        action: RedisActionsEnum.REQUEST,
      })
    );
    return await this.tokenService.createLoginCredentials(user, issure);
  }
  async forgetPassword({ email }: ResendOTPDTO): Promise<string> {
    const user = await this.userRepository.findOne({
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        confirmedAt: { $exists: true },
      },
    });
    if (!user) {
      throw new NotFoundException('Fail to find matching account');
    }
    await this.oTPService.isKeyExpired({
      email,
      type: RedisTypeEnum.FORGETPASSWORD,
    });
    await this.oTPService.generateOtpAndSendOtpEmail({
      email,
      expiredTime: 2,
      title: OTPTitleEnum.FORGETPASSWORD,
      subject: OTPSubjectEnum.FORGETPASSWORD,
    });
    return 'OTP sent to your email';
  }
  async confirmForgetPassword({ email, otp }: ConfirmOTPDTO): Promise<string> {
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmedAt: { $exists: false },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!user) {
      throw new ConflictException('Fail to find matching account');
    }
    await this.oTPService.verifyOTP({
      email,
      type: OTPTitleEnum.FORGETPASSWORD,
      otp,
    });

    void this.redis.deleteKey(
      this.redis.RedisKey({ key: email, type: RedisTypeEnum.FORGETPASSWORD })
    );
    void this.redis.set({
      key: this.redis.RedisKey({
        type: RedisTypeEnum.RESETPASSWORD,
        key: email,
      }),
      value: 1,
      ttl: 120,
    });
    return 'OTP verified successfully';
  }
  async resetPassword({ email, password }: ResetPasswordDTO): Promise<string> {
    const user = await this.userRepository.findOne({
      filter: {
        email,
        confirmedAt: { $exists: true },
        provider: ProviderEnum.SYSTEM,
      },
    });
    if (!user) {
      throw new NotFoundException('Fail to find matching account');
    }
    const session = await this.redis.get({
      key: this.redis.RedisKey({
        type: RedisTypeEnum.RESETPASSWORD,
        key: email,
      }),
    });
    if (!session) {
      throw new UnauthorizedException('Invalid reset session');
    }
    const newPassword = password;
    const checkSamePassword = await this.secuirtyService.compareHash(
      newPassword,
      user.password
    );
    if (checkSamePassword) {
      throw new ConflictException("This password used befor you can't use it");
    }
    user.password = newPassword;
    user.changeCredentialsTime = new Date(Date.now());
    await user.save();
    return 'Password changed Successfuly';
  }
  async signupWithGmail(
    { idToken }: SignWhitGoogleDTO,
    issuer: string
  ): Promise<{ credentials: IGenerateToken; status?: number }> {
    const payload = await this.verifyGoogleAccount({ idToken });
    const checkUserExist = await this.userRepository.findOne({
      filter: { email: payload.email },
    });
    if (checkUserExist) {
      if (checkUserExist?.provider === ProviderEnum.SYSTEM) {
        throw new ConflictException(
          'Account already exist with diffrent provider '
        );
      }
      const credentials = await this.loginWithGmail({ idToken }, issuer);
      return { credentials, status: 200 };
    }
    const user = await this.userRepository.createOne({
      data: {
        firstName: payload.given_name,
        lastName: payload.family_name,
        email: payload.email,
        provider: ProviderEnum.GOOGLE,
        profileImage: payload.picture,
        confirmedAt: new Date(),
      },
    });
    return {
      credentials: await this.tokenService.createLoginCredentials(user, issuer),
      status: 201,
    };
  }
  async loginWithGmail(
    { idToken }: SignWhitGoogleDTO,
    issuer: string
  ): Promise<IGenerateToken> {
    const payload = await this.verifyGoogleAccount({ idToken });
    const user = await this.userRepository.findOne({
      filter: { email: payload.email, provider: ProviderEnum.GOOGLE },
    });

    if (!user) {
      throw new NotFoundException(
        'Invalid login credentials or invalid login approach'
      );
    }
    return await this.tokenService.createLoginCredentials(user, issuer);
  }
}
