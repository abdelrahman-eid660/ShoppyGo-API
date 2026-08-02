import { AuthenticationService } from './authentication.service';
import {
  Body,
  Controller,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ConfirmOTPDTO,
  LoginDTO,
  ResendOTPDTO,
  ResetPasswordDTO,
  SignupDTO,
  SignWhitGoogleDTO,
} from './dto/authentication.dto';
import type { Request, Response } from 'express';
import { Throttle, SkipThrottle } from '@nestjs/throttler';
@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup')
  async signup(@Body()body: SignupDTO): Promise<string> {
    return await this.authenticationService.signup(body);
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch('resend-Confirm-OTP')
  async resendConfirmEmail(@Body() body: ResendOTPDTO): Promise<string> {
    return await this.authenticationService.resendConfirmEmail(body);
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch('Confirm-OTP')
  async confirmEmail(@Body() body: ConfirmOTPDTO): Promise<string> {
    return await this.authenticationService.confirmEmail(body);
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('login')
  async login(@Body()body: LoginDTO,@Req()req: Request , @Res({passthrough : true}) res : Response) : Promise<{message : string}>{
     const tokens =await this.authenticationService.login(body, `${req.protocol}://${req.host}`, req.headers['accept-language'] as string);
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true, sameSite: 'lax', secure: true,maxAge: 1000 * 60 * 15,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true, sameSite: 'lax',secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 * 12,
    });
    return {
        message: 'Login Successfully',
    };
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('forget-password')
  async forgetPassword(@Body()body: ResendOTPDTO) : Promise<string> {
    return await this.authenticationService.forgetPassword(body)
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch('confirm-forget-password')
  async confirmForgetPassword(@Body()body: ConfirmOTPDTO) : Promise<string> {
    return await this.authenticationService.confirmForgetPassword(body)
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Patch('reset-password')
  async resetPassword(@Body()body: ResetPasswordDTO):Promise<string> {
    return await this.authenticationService.resetPassword(body)
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signup-with-gmail')
  async signupWithGmail(@Body()body: SignWhitGoogleDTO,@Req()req: Request,@Res({ passthrough: true })res: Response): Promise<{status? : number , message : string}> {
    const { credentials, status } = await this.authenticationService.signupWithGmail( body, `${req.protocol}://${req.host}`);
    res.status(status as number);
    res.cookie('accessToken', credentials.accessToken, {
      httpOnly: true, sameSite: 'lax', secure: true,maxAge: 1000 * 60 * 15,
    });

    res.cookie('refreshToken', credentials.refreshToken, {
        httpOnly: true, sameSite: 'lax',secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 * 12,
    });
    return { status, message: 'Login Successfully' };
  }
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('signin-with-gmail')
  async loginWithGmail(@Body()body: SignWhitGoogleDTO,@Req()req: Request,@Res({ passthrough: true })res: Response ): Promise<{status? : number , message : string}> {
    const tokens = await this.authenticationService.loginWithGmail( body,`${req.protocol}://${req.host}`)
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true, sameSite: 'lax', secure: true,maxAge: 1000 * 60 * 15,
    });

    res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true, sameSite: 'lax',secure: true, maxAge: 1000 * 60 * 60 * 24 * 30 * 12,
    });
    return {
        message: 'Login Successfully',
    };
  }
}
