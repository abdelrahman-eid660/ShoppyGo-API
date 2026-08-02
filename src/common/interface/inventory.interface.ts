import { Types } from "mongoose";
import { IUser } from "./user.interface";
import { IProductVariant } from "./product.interface";
import { IWareHouse } from "./warehouse.interface";

export interface IInventory {
  _id: Types.ObjectId;

  productVariantId: Types.ObjectId | IProductVariant;
  wareHouseId: Types.ObjectId | IWareHouse;

  quantity: number;
  reserved: number;
  availableQuantity: number;
  sold: number;
  costPrice : number

  lowStockThreshold: number;

  skuSnapshot? : string
  productTitleSnapshot? : string
  governorateWarehouseSnapshot? : string

  createdBy : Types.ObjectId | IUser
  updatedBy? : Types.ObjectId | IUser

  lastStockUpdate? : Date
  updatedAt: Date;
  createdAt: Date;
  
  deletedAt?: Date;
  restoredAt?: Date;
}