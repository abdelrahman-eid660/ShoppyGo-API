import { Types } from "mongoose";

export interface IWishlistItem {
  productId: Types.ObjectId;

  variantId?: Types.ObjectId;

  addedAt: Date;
}

export interface IWishlist {
  _id: Types.ObjectId;

  userId: Types.ObjectId;

  items: IWishlistItem[];

  createdAt: Date;

  updatedAt: Date;
}