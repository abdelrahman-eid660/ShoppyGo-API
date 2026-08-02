import { Types } from 'mongoose';
import { IUser } from './user.interface';
import { IBrand } from './brand.interface';
import { ISupplier } from './supplier.interface';

export interface IBrandSupplier {
  _id: Types.ObjectId;

  supplierId: Types.ObjectId | ISupplier;
  brandId: Types.ObjectId | IBrand;

  supplierNameSnapshot : string
  brandNameSnapshot : string
  
  isPrimary: boolean;
  isActive: boolean;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  createdAt : Date
  updatedAt : Date
}
