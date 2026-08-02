import { Types } from "mongoose";
import { IProductVariant } from "./product.interface";
export interface ICartItem {
  variantId: Types.ObjectId | IProductVariant;
  quantity: number;
  priceSnapshot: number;
  skuSnapshot: string;
  imageSnapshot?: string;
}
export interface ICart {
  createdBy: Types.ObjectId;

  items: ICartItem[];

  totalPrice: number;

  createdAt?: Date;
  updatedAt?: Date;
}