import { CouponTypeEnum } from "../enum";

export interface ICoupon {
  code: string;

  type: CouponTypeEnum;

  value: number;

  minOrderAmount?: number;
  
  usedCount: number
  
  usageLimit: number;

  isActive: boolean

  expiresAt: Date;
}