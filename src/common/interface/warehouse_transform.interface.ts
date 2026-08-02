import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { SharedStatusEnum } from "../enum";
import { IWareHouse } from "./warehouse.interface";
import { IProductVariant } from "./product.interface";
export interface IWareHouseTransformItems {
    productVariantId : Types.ObjectId | IProductVariant
    quantity : number
    productVariantNameSnapshot : string
}
export interface IWareHouseTransform {
  _id : Types.ObjectId

  fromWarehouseId : Types.ObjectId | IWareHouse 
  toWarehouseId : Types.ObjectId | IWareHouse

  status : SharedStatusEnum;
  items : IWareHouseTransformItems[]
  notes : string

  createdBy : Types.ObjectId | IUser
  updatedBy : Types.ObjectId | IUser

  approvedBy : Types.ObjectId | IUser
  approvedAt : Date

  transformedAt?: Date;
  leaveAt: Date;

  createdAt : Date
  updatedAt : Date
}
