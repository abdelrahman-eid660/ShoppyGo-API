import { Types } from 'mongoose';
import { IProductVariant } from './product.interface';
export interface IReview {
  _id : Types.ObjectId
  createdBy: Types.ObjectId;
  updatedBy: Types.ObjectId;
  
  productId: Types.ObjectId;
  variantId: Types.ObjectId | IProductVariant;
  variantSnapshot? : string

  rating: number;
  comment: string;
  isApproved: boolean;
  
  isRejected? : boolean
  rejectedAt? : Date
  rejectReson? : string

  createdAt: Date;
  updatedAt: Date;
}
