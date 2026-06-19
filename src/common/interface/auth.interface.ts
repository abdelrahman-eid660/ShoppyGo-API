import { JwtPayload } from 'jsonwebtoken';
import { Socket } from 'socket.io';
import type { Request } from 'express';
import { HUserDocument } from 'src/DB/models';

export interface ISingupResponse {
  message: string;
}
export interface IGenerateToken {
  accessToken: string;
  refreshToken: string;
}
export interface IAuthReq extends Request {
  user: HUserDocument;
  decode: JwtPayload;
}
export interface IDecodedToken {
  user: HUserDocument;
  decode: JwtPayload;
}

export interface ISocket extends Socket {
  data: IAuthReq;
}
