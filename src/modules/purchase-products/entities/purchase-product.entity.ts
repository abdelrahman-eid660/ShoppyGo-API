import { Field, Float, GraphQLISODateTime, ID, Int, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Types } from "mongoose";
import { PurchaseProcessStatusEnum, SharedCurrencyEnum } from "src/common/enum";
import type{ Address, IProductVariant, IPurchaseItems, IPurchaseProducts, ISupplier, IUser, IWareHouse } from "src/common/interface";
import { OneProductVariantsResponse } from "src/modules/product-variant/entities/product-variant.entity";
import { OneAddressResponse, OneUserResponse } from "src/modules/user/entity";
import { OneWarehouseResponse } from "src/modules/warehouse/entities/warehouse.entity";
registerEnumType(PurchaseProcessStatusEnum , {name : "PurchaseProcessStatus"})
@ObjectType()
export class OneSupplierResponse implements Partial<ISupplier> {
  @Field(() => ID, { nullable: true })
  _id!: Types.ObjectId;

  @Field(() => String, { nullable: true })
  name!: string;

  @Field(() => String, { nullable: true })
  email?: string;

  @Field(() => [String], { nullable: true })
  phone?: string[];

  @Field(() => OneAddressResponse, { nullable: true })
  address?: Address;

  @Field(() => Boolean, { nullable: true })
  isActive!: boolean;

  @Field(() => Float, { nullable: true })
  rating?: number;

  @Field(() => OneUserResponse, { nullable: true })
  createdBy!: Types.ObjectId | IUser;

  @Field(() => OneUserResponse, { nullable: true })
  updatedBy!: Types.ObjectId | IUser;

  @Field(() => GraphQLISODateTime, { nullable: true })
  createdAt!: Date;

  @Field(() => GraphQLISODateTime, { nullable: true })
  updatedAt!: Date;
}

@ObjectType()
export class PurchaseItemsResponse implements Partial<IPurchaseItems> {
  @Field(() => Float, { nullable: true })
  costPrice?: number;

  @Field(() => SharedCurrencyEnum, { nullable: true })
  currencySnapshot?: SharedCurrencyEnum;

  @Field(() => Int, { nullable: true })
  orderedQuantity?: number;

  @Field(() => OneProductVariantsResponse, { nullable: true })
  productVariantId?: Types.ObjectId | IProductVariant;

  @Field(() => Int, { nullable: true })
  receivedQuantity?: number;

  @Field(() => Int, { nullable: true })
  remainingQuantity?: number;

  @Field(() => String, { nullable: true })
  skuSnapshot?: string;
}
@ObjectType()
export class OnePurchaseProductResponse
  implements Partial<IPurchaseProducts>
{
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field(() => OneSupplierResponse, { nullable: true })
  supplierId?: Types.ObjectId | ISupplier;

  @Field(() => OneWarehouseResponse, { nullable: true })
  wareHouseId?: Types.ObjectId | IWareHouse;

  @Field(() => [PurchaseItemsResponse], { nullable: true })
  items?: IPurchaseItems[];

  @Field(() => Float, { nullable: true })
  totalCost?: number;

  @Field(() => PurchaseProcessStatusEnum, { nullable: true })
  status?: PurchaseProcessStatusEnum;

  @Field(() => String, { nullable: true })
  supplierNameSnapshot?: string;

  @Field(() => OneUserResponse, { nullable: true })
  createdBy?: Types.ObjectId | IUser;

  @Field(() => OneUserResponse, { nullable: true })
  updatedBy?: Types.ObjectId | IUser;

  @Field(() => String, { nullable: true })
  expectedAt?: Date;

  @Field(() => String, { nullable: true })
  receivedAt?: Date;

  @Field(() => String, { nullable: true })
  createdAt?: Date;

  @Field(() => String, { nullable: true })
  updatedAt?: Date;
}