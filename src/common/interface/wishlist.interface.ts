import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { IProduct, IProductVariant } from "./product.interface";

export interface IWishlistItem {
  variantId: Types.ObjectId | IProductVariant;
  productId?: Types.ObjectId | IProduct;
}

export interface IWishlist {
  createdBy: Types.ObjectId | IUser;

  items: IWishlistItem[];
  totalItems? : number
  createdAt: Date;

  updatedAt: Date;
}