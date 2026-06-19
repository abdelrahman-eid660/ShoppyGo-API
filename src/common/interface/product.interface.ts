import { Types } from 'mongoose';
import { IBrand } from './brand.interface';
import { ICategory } from './category.interface';
import { IUser } from './user.interface';
export interface IProductAttribute {
  key: string; // slug-like key
  label: string; // اسم يظهر للمستخدم
  value: string; // القيمة
  unit?: string; // kg, cm, GB
}
export interface IProductVariant {
  productId: Types.ObjectId;

  sku: string; // code for prodcut like NIKE-AF-BLK-42

  slug: string;

  price: number;

  stock: number;

  color?: string;

  size?: string;

  images: string[];

  attributes: Record<string, string>; // for changes attributes between same product 
  
  createdBy: Types.ObjectId | IUser;
  updatedBy?: Types.ObjectId | IUser;

  isPublished: boolean;
}
export interface IProduct {
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

  createdAt?: Date;
  updatedAt?: Date;

  deletedAt?: Date;
  restoredAt?: Date;
}
