import { Types } from 'mongoose';
import { IBrand } from './brand.interface';
import { ICategory } from './category.interface';
import { IUser } from './user.interface';
import { ISupplier } from './supplier.interface';
import { SharedCurrencyEnum } from '../enum';
export interface IProductAttribute {
  key: string; // slug-like key
  label: string; // اسم يظهر للمستخدم
  value: string; // القيمة
  unit?: string; // kg, cm, GB
}
export interface IProductVariant {
  _id : Types.ObjectId
  
  productId: Types.ObjectId | IProduct;
  brandId: Types.ObjectId | IBrand
  categoryId: Types.ObjectId | ICategory
  sku: string; // code for prodcut like NIKE-AF-BLK-42

  slug: string;

  description? : string
  
  price: number;
  stock: number

  images?: string[];

  attributes: IProductAttribute[]; // for changes attributes between same product 
  
  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  deletedAt?: Date
  restoredAt?: Date

  rating?: number;
  reviewCount?: number;

  isPublished: boolean;
  isDefualt?: boolean;
}
export interface IProduct {
  _id : Types.ObjectId

  title: string;
  description: string;

  brandId: Types.ObjectId | IBrand;
  categoryId: Types.ObjectId | ICategory;

  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  basePrice: number;

  rating?: number;
  reviewCount?: number;

  image: string;
  gallery: string[];

  attributes?: IProductAttribute[]; // for fixed attribute
  isPublished: boolean;

  createdAt?: Date;
  updatedAt?: Date;

  deletedAt?: Date;
  restoredAt?: Date;
}
export interface IProductSupplier {
  _id: Types.ObjectId;

  supplierId: Types.ObjectId | ISupplier;

  productVariantId: Types.ObjectId | IProductVariant;

  costPrice: number;

  currency: SharedCurrencyEnum;

  leadTimeDays?: number; // وقت التوريد

  minOrderQuantity?: number; // الحد الادني اللي بيطلعه من الشغل

  isPrimary: boolean; // المورد الأساسي

  isActive: boolean;

  createdBy : Types.ObjectId | IUser
  updatedBy? : Types.ObjectId | IUser

  variantTitleSnapshot? : string

  createdAt: Date;
  updatedAt: Date;
}
