import { Types } from 'mongoose';
import { ISupplier } from './supplier.interface';
import {SharedCurrencyEnum, PurchaseProcessStatusEnum } from '../enum';
import { IUser } from './user.interface';
import { IWareHouse } from './warehouse.interface';
import { IProductVariant } from './product.interface';

export class IPurchaseItems {
  productVariantId!: Types.ObjectId | IProductVariant;
  orderedQuantity!: number;
  remainingQuantity!: number;
  receivedQuantity!: number;
  costPrice!: number;
  skuSnapshot! : string;
  currencySnapshot! : SharedCurrencyEnum
}
export interface IPurchaseProducts {
  _id: Types.ObjectId;

  supplierId: Types.ObjectId | ISupplier;
  wareHouseId: Types.ObjectId | IWareHouse;
  createdBy: Types.ObjectId | IUser;
  updatedBy: Types.ObjectId | IUser;

  items:IPurchaseItems[]

  supplierNameSnapshot: string

  totalCost: number;
  status: PurchaseProcessStatusEnum;

  expectedAt?: Date;
  receivedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}
