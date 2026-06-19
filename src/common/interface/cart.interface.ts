import { Types } from "mongoose";
import { IProduct, IProductVariant } from "./product.interface";
export interface ICartItem {
  productId: Types.ObjectId | IProduct;
  variantId: Types.ObjectId | IProductVariant;

  quantity: number;

  priceSnapshot: number;
}
export interface ICart {
  userId: Types.ObjectId;

  items: ICartItem[];

  totalPrice: number;

  updatedAt?: Date;
}