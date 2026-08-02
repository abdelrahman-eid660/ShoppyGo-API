import { Types } from 'mongoose';
import { GenderEnum, LanguageEnum, PermissionEnum, ProviderEnum, RoleEnum } from '../enum';
export type Address = {
    country: string;
    governorate: string;
    zone: string;
    street: string;
    postalCode: number;
  } 
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userName?: string;
  lang: LanguageEnum;
  DOB?: Date;
  address?: Address;
  phone?: string;
  profileImage?: string;
  permissions: PermissionEnum[];
  confirmedAt: Date;
  provider: ProviderEnum;
  gender: GenderEnum;
  role: RoleEnum;
  createdBy?: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;
  createdAt: Date;
  updatedAt: Date;
  changeCredentialsTime?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
