import { Types } from "mongoose";

export interface IStockAlert {
  createdBy: Types.ObjectId;
  productVariantId: Types.ObjectId;
  variantSnapshot: string;
  isNotified: boolean;
  createdAt: Date;
  updatedAt: Date;
}