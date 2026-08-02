import { Types } from 'mongoose';
import { IUser } from './user.interface';

export interface IBrand {
  name: string;
  slug: string;
  logo: string;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  isPublished : boolean

  createdAt: Date;
  updatedAt: Date;

  deletedAt?: Date;
  restoredAt?: Date;
}
export interface PublicBrandResponse {
  id: string;
  name: string;
  logo: string;
}
export interface AdminBrandResponse {
  id: string;
  name: string;
  logo: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}
