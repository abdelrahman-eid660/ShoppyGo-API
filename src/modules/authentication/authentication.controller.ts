import { AuthenticationService } from './authentication.service';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
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

@Controller('auth')
export class AuthenticationController {
  constructor(private readonly authenticationService: AuthenticationService) {}
  @Post('signup')
  async signup(
    @Body()
    body: SignupDTO
  ) {
    return await this.authenticationService.signup(body);
  }
  @Patch('resend-Confirm-OTP')
  async resendConfirmEmail(@Body() body: ResendOTPDTO) {
    return await this.authenticationService.resendConfirmEmail(body);
  }
  @Patch('Confirm-OTP')
  async confirmEmail(@Body() body: ConfirmOTPDTO) {
    return await this.authenticationService.confirmEmail(body);
  }
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body()
    body: LoginDTO,
    @Req()
    req: Request
  ) {
    return {
      data: await this.authenticationService.login(
        body,
        `${req.protocol}://${req.host}`,
        req.headers['accept-language'] as string
      ),
    };
  }
  @Post('forget-password')
  async forgetPassword(
    @Body()
    body: ResendOTPDTO
  ) {
    return {
      data: await this.authenticationService.forgetPassword(body),
    };
  }
  @Patch('confirm-forget-password')
  async confirmForgetPassword(
    @Body()
    body: ConfirmOTPDTO
  ) {
    return {
      data: await this.authenticationService.confirmForgetPassword(body),
    };
  }
  @Patch('reset-password')
  async resetPassword(
    @Body()
    body: ResetPasswordDTO
  ) {
    return {
      data: await this.authenticationService.resetPassword(body),
    };
  }
  @Post('signup-with-gmail')
  async signupWithGmail(
    @Body()
    body: SignWhitGoogleDTO,
    @Req()
    req: Request,
    @Res({ passthrough: true })
    res: Response
  ) {
    const { credentials, status } =
      await this.authenticationService.signupWithGmail(
        body,
        `${req.protocol}://${req.host}`
      );
    res.status(status as number);
    return { status, data: credentials };
  }
  @Post('signin-with-gmail')
  async loginWithGmail(
    @Body()
    body: SignWhitGoogleDTO,
    @Req()
    req: Request
  ) {
    return {
      data: await this.authenticationService.loginWithGmail(
        body,
        `${req.protocol}://${req.host}`
      ),
    };
  }
}
