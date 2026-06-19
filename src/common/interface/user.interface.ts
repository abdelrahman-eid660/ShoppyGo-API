import { Types } from 'mongoose';
import { GenderEnum, LanguageEnum, PermissionEnum, ProviderEnum, RoleEnum } from '../enum';
export type Address = {
    country: string;
    city: string;
    street: string;
    postalCode: string;
  } 
export interface IUser {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userName?: string;
  lang: LanguageEnum;
  DOB?: Date;
  address: Address;
  phone?: string;
  profileImage?: string;
  permissions: PermissionEnum[];
  coverImage?: string;
  confirmedAt: Date;
  provider: ProviderEnum;
  gender: GenderEnum;
  role: RoleEnum;
  createdBy?: Types.ObjectId;
  updatedBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
  changeCredentialsTime?: Date;
  deletedAt?: Date;
  restoredAt?: Date;
}
