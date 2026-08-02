import { Types } from 'mongoose';
import { IWareHouse } from './warehouse.interface';
import { IUser } from './user.interface';
import { IProductVariant } from './product.interface';
import { SharedStatusEnum, StockAdjustmentReasonEnum, StockStatusEnum } from '../enum';

export interface IStockAdjustmentItems {
  productVariantId: Types.ObjectId | IProductVariant;
  skuSnapshot? : string
  stockStatus? : StockStatusEnum
  expectedQuantity: number;
  countedQuantity: number;
  difference: number;
  reason?: StockAdjustmentReasonEnum;
  customeResone?: string;
  notes?: string;
}

export interface IStockAdjustment {
  _id: Types.ObjectId;

  warehouseId: Types.ObjectId | IWareHouse;
  warehouseNameSnapshot? : string
  items: IStockAdjustmentItems[];

  status: SharedStatusEnum;

  notes: string;

  createdBy: Types.ObjectId | IUser;
  updatedBy: Types.ObjectId | IUser;

  approvedBy: Types.ObjectId | IUser;
  approvedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}
