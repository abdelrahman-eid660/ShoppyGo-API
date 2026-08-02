/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
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
import { IAuthReq, IAuthSocket } from '../interface';
import { Reflector } from '@nestjs/core';
import { TokenTypeEnum } from '../enum';
import { tokenTypeName } from '../decorator';
import { parseCookie } from 'cookie';
import { IS_PUBLIC_KEY } from '../decorator/public.decorator';
@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly tokenService: TokenService
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(),context.getClass()]);
      const tokenType = this.reflector.getAllAndOverride<TokenTypeEnum>(tokenTypeName, [context.getHandler() , context.getClass()]) ?? TokenTypeEnum.ACCESS;
      let authorization!: string;
      let req!: IAuthReq | IAuthSocket;
      const type = context.getType<'http' | 'ws' | 'graphql'>();
      switch (type) {
        case 'ws':
          req = context.switchToWs().getClient() as IAuthSocket
          const cookies = parseCookie(req.handshake.headers.cookie ?? '');
          if (tokenType === TokenTypeEnum.REFREASH) {
            authorization = cookies.refreshToken ?? req.handshake.auth.authorization ?? req.handshake.headers.authorization;
          }else{
            authorization = cookies.accessToken ?? req.handshake.auth.authorization ?? req.handshake.headers.authorization;
          }
          break;
        case 'graphql':
          const gqlContext = GqlExecutionContext.create(context);
          req = gqlContext.getContext().req as IAuthReq
          if (tokenType === TokenTypeEnum.REFREASH) {
            authorization = req.cookies?.refreshToken ?? req.headers.authorization as string;
          } else {
            authorization = req.cookies?.accessToken ?? req.headers.authorization as string;
          }
          break;
        default:
        case 'http':
          req = context.switchToHttp().getRequest() as IAuthReq
          if (tokenType === TokenTypeEnum.REFREASH) {
            authorization = req.cookies?.refreshToken ?? req.headers.authorization as string;
          } else {
            authorization = req.cookies?.accessToken ?? req.headers.authorization as string;
          }
          break;
      }
      if (!authorization) {
        if (isPublic) {
          req.user = null as any;
          return true;
        }
        throw new UnauthorizedException('Missing authorization');
      }
      let credential = authorization;
      if (authorization.startsWith('Bearer ')) {
        credential = authorization.slice(7);
      }
      const { user, decode } = await this.tokenService.decodedToken({token: credential,tokenType});
      req.user  = user;
      req.decode = decode;
      return true;
    } catch (error : any) {
      const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [context.getHandler(),context.getClass()]);
      if (isPublic) {
        const req = context.getType<'http' | 'ws' | 'graphql'>() === 'graphql'
          ? GqlExecutionContext.create(context).getContext().req
          : context.switchToHttp().getRequest();
        req.user = null;
        return true;
      }
      throw new UnauthorizedException(error.message);
    }
  }
}
