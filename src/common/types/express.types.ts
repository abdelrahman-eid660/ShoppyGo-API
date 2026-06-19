import { HydratedDocument } from 'mongoose';
import { JwtPayload } from 'jsonwebtoken';
import { IUser } from '../interface/user.interface';
import { Socket } from 'socket.io';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user: HydratedDocument<IUser>;
      decode: JwtPayload;
      token: string;
    }
  }
}
