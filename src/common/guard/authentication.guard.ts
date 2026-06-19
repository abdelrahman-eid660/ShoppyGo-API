/* eslint-disable no-case-declarations */
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { TokenService } from '../service';
import { GqlExecutionContext } from '@nestjs/graphql';
import { IAuthReq } from '../interface';
import { Reflector } from '@nestjs/core';
import { TokenTypeEnum } from '../enum';
import { tokenTypeName } from '../decorator';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tokenType =
      this.reflector.getAllAndOverride<TokenTypeEnum>(tokenTypeName, [
        context.getHandler() || context.getClass(),
      ]) ?? TokenTypeEnum.ACCESS;
    let authorization!: string;
    let req!: IAuthReq;
    const type = context.getType<'http' | 'ws' | 'graphql'>();
    switch (type) {
      case 'ws':
        req = context.switchToWs().getClient();
        authorization = req.headers.authorization as string;
        break;
      case 'graphql':
        const gqlContext = GqlExecutionContext.create(context);
        req = gqlContext.getContext().req;
        authorization = req.headers.authorization as string;
        break;
      default:
      case 'http':
        req = context.switchToHttp().getRequest();
        authorization = req.headers.authorization as string;
        break;
    }
    if (!authorization) {
      throw new UnauthorizedException('Missing authorization');
    }
    try {
      const [Key, credential] = authorization.split(' ') || [];
      const { user, decode } = await this.tokenService.decodedToken({
        token: credential,
        tokenType,
      });
      req.user = user;
      req.decode = decode;
      return true;
    } catch (error: any) {
      throw new BadRequestException(error.message);
    }
  }
}
