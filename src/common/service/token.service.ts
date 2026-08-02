/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import jwt, { JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { ObjectId } from 'mongoose';
import { UserRepository } from '../../DB/Repository';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { RoleEnum, TokenTypeEnum } from '../enum';
import { CacheService } from './cache';
import {
  GenerateTokenParams,
  TokenSignature,
  VerifyTokenParams,
} from '../types/token.types';
import { IDecodedToken, IGenerateToken } from '../interface';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class TokenService {
  private ACCESS_EXPIRES_IN;
  private ADMIN_REFREASH_TOKEN_SECRET_KEY;
  private ADMIN_TOKEN_SECRET_KEY;
  private REFREASH_EXPIRES_IN;
  private SUPERVISER_REFREASH_TOKEN_SECRET_KEY;
  private SUPERVISER_TOKEN_SECRET_KEY;
  private USER_REFREASH_TOKEN_SECRET_KEY;
  private USER_TOKEN_SECRET_KEY;
  constructor(
    private readonly jwtService: JwtService,
    private readonly userRepository: UserRepository,
    private readonly redis: CacheService,
    private readonly configService: ConfigService
  ) {
    this.ACCESS_EXPIRES_IN = parseInt(configService.get('ACCESS_EXPIRES_IN')!);
    this.ADMIN_REFREASH_TOKEN_SECRET_KEY = configService.get(
      'ADMIN_REFREASH_TOKEN_SECRET_KEY'
    );
    this.ADMIN_TOKEN_SECRET_KEY = configService.get('ADMIN_TOKEN_SECRET_KEY');
    this.REFREASH_EXPIRES_IN = parseInt(configService.get('REFREASH_EXPIRES_IN')!);
    this.SUPERVISER_REFREASH_TOKEN_SECRET_KEY = configService.get(
      'SUPERVISER_REFREASH_TOKEN_SECRET_KEY'
    );
    this.SUPERVISER_TOKEN_SECRET_KEY = configService.get(
      'SUPERVISER_TOKEN_SECRET_KEY'
    );
    this.USER_REFREASH_TOKEN_SECRET_KEY = configService.get(
      'USER_REFREASH_TOKEN_SECRET_KEY'
    );
    this.USER_TOKEN_SECRET_KEY = configService.get('USER_TOKEN_SECRET_KEY');
  }
  async sign({
    payload,
    secret = this.USER_TOKEN_SECRET_KEY,
    options,
  }: GenerateTokenParams = {}): Promise<string> {
    return await this.jwtService.signAsync(payload as object, {
      secret,
      ...options,
    });
  }

  async verify({
    token,
    secret = this.USER_TOKEN_SECRET_KEY,
  }: VerifyTokenParams): Promise<string | JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret });
      return payload;
    } catch (error) {
      throw new UnauthorizedException('Token expired');
    }
  }

  async getTokenSignature(role: string): Promise<TokenSignature> {
    let accessSignature: string;
    let refreashSignature: string;
    let audience: string = RoleEnum.USER;
    switch (role) {
      case RoleEnum.SUPERVISOR:
        accessSignature = this.SUPERVISER_TOKEN_SECRET_KEY;
        refreashSignature = this.SUPERVISER_REFREASH_TOKEN_SECRET_KEY;
        audience = RoleEnum.SUPERVISOR;
        break;
      case RoleEnum.ADMIN:
        accessSignature = this.ADMIN_TOKEN_SECRET_KEY;
        refreashSignature = this.ADMIN_REFREASH_TOKEN_SECRET_KEY;
        audience = RoleEnum.ADMIN;
        break;
      case RoleEnum.SUPERADMIN:
        accessSignature = this.ADMIN_TOKEN_SECRET_KEY;
        refreashSignature = this.ADMIN_REFREASH_TOKEN_SECRET_KEY;
        audience = RoleEnum.ADMIN;
        break;
      default:
        accessSignature = this.USER_TOKEN_SECRET_KEY;
        refreashSignature = this.USER_REFREASH_TOKEN_SECRET_KEY;
        audience = RoleEnum.USER;
        break;
    }
    return { accessSignature, refreashSignature, audience };
  }

  async createLoginCredentials(
    user: any,
    issuer: string
  ): Promise<IGenerateToken> {
    const { accessSignature, refreashSignature, audience }: TokenSignature =
      await this.getTokenSignature(user.role);
    const jwtId = randomUUID();
    const accessToken = await this.sign({
      payload: { sub: user._id },
      secret: accessSignature,
      options: {
        issuer,
        expiresIn: this.ACCESS_EXPIRES_IN,
        jwtid: jwtId,
        audience: [String(TokenTypeEnum.ACCESS), String(audience)],
      },
    });
    const refreshToken = await this.sign({
      payload: { sub: user._id },
      secret: refreashSignature,
      options: {
        issuer,
        expiresIn: this.REFREASH_EXPIRES_IN,
        jwtid: jwtId,
        audience: [String(TokenTypeEnum.REFREASH), String(audience)],
      },
    });
    return { accessToken, refreshToken };
  }

  async decodedToken({
    token,
    tokenType = TokenTypeEnum.ACCESS,
  }: {
    token: string;
    tokenType?: number;
  }): Promise<IDecodedToken> {
    const decode = jwt.decode(token) as JwtPayload;
    if (!decode?.aud?.length) {
      throw new BadRequestException('Fail to decoded token aud is required');
    }
    const [decodedTokenType, audience] = decode.aud || [];
    if (String(tokenType) !== decodedTokenType) {
      throw new BadRequestException(
        `Invalid token type token of type ${decodedTokenType} cannot access this api while we expected token of type ${tokenType}`
      );
    }
    const { accessSignature, refreashSignature } =
      await this.getTokenSignature(audience);
    const verifiedDate = await this.verify({
      token,
      secret:
        tokenType === TokenTypeEnum.REFREASH
          ? refreashSignature
          : accessSignature,
    });
    const user = await this.userRepository.findOne({
      filter: { _id: verifiedDate.sub as unknown as ObjectId },
    });
    if (!user) {
      throw new UnauthorizedException('Not Register account');
    }
    const tokenKey = this.redis.RevokeSingleTokenKey(
      String(user._id),
      String(decode.jti)
    );
    const isRevoked = await this.redis.exists(tokenKey);
    if (isRevoked > 0) {
      throw new UnauthorizedException('Invalid login session');
    }
    const revokeAll = await this.redis.get({
      key: this.redis.RevokeAllTokenKey(String(user._id)),
    });
    if (revokeAll && Number(decode.iat) < Number(revokeAll)) {
      throw new UnauthorizedException('Invalid login session');
    }
    return { user, decode };
  }
}
