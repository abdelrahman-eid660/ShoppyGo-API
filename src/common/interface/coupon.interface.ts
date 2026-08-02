import { Types } from "mongoose";
import { CouponTypeEnum } from "../enum";
import { IUser } from "./user.interface";
export interface ICoupon {
  code: string;
  slug?: string;
  image: string;

  type: CouponTypeEnum;

  value: number;
  minOrderAmount?: number;
  maxDiscountAmount?: number;
  
  usedCount: number
  usageLimit: number;

  isActive: boolean

  description? : string

  startAt: Date;
  expiresAt: Date;

  createdBy : Types.ObjectId | IUser
  updatedBy? : Types.ObjectId | IUser
  orderId? : Types.ObjectId

  createdAt: Date;
  updatedAt: Date;
}