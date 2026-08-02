import { Types } from "mongoose";
import { IProductVariant } from "./product.interface";
import { IWareHouse } from "./warehouse.interface";
import { IUser } from "./user.interface";
import { InventoryMovementType, ReferenceModelEnum } from "../enum";

export interface IInventoryMovement {
  _id : Types.ObjectId

  productVariantId : Types.ObjectId | IProductVariant
  wareHouseId : Types.ObjectId | IWareHouse

  quantity : string
  beforeQuantity : number
  afterQuantity : number

  skuSnapshot? : string
  wareHouseSnapshot? : string
  productTitleSnapshot? : string

  type : InventoryMovementType;
  referenceId : Types.ObjectId;
  referenceModel : ReferenceModelEnum

  createdBy? :  Types.ObjectId | IUser ;
  isSystemAction? :  boolean;
  updatedBy? :  Types.ObjectId | IUser;

  createdAt : Date;
  updatedAt : Date;
}
