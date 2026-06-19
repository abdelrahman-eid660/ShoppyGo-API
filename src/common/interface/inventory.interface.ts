import { Types } from "mongoose";

export interface IInventory {
  _id: Types.ObjectId;

  productVariantId: Types.ObjectId;

  quantity: number;

  reserved: number;

  sold: number;

  lowStockThreshold: number;

  updatedAt: Date;
}