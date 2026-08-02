import { Field, Float, ID, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Types } from "mongoose";
import { SharedStatusEnum, StockAdjustmentReasonEnum, StockStatusEnum } from "src/common/enum";
import { IProductVariant, IStockAdjustment, IStockAdjustmentItems, IUser, IWareHouse } from "src/common/interface";
import { OneProductVariantsResponse } from "src/modules/product-variant/entities/product-variant.entity";
import { OneUserResponse } from "src/modules/user/entity";
import { OneWarehouseResponse } from "src/modules/warehouse/entities/warehouse.entity";
registerEnumType(StockStatusEnum , {name : 'StockStatus'})
registerEnumType(StockAdjustmentReasonEnum , {name : 'StockAdjustmentReason'})
registerEnumType(SharedStatusEnum , {name : 'SharedStatus'})

@ObjectType()
export class StockAdjustmentItemsResponse
  implements Partial<IStockAdjustmentItems>
{
  @Field(() => OneProductVariantsResponse, { nullable: true })
  productVariantId?: Types.ObjectId | IProductVariant;

  @Field(() => String, { nullable: true })
  skuSnapshot?: string;

  @Field(() => StockStatusEnum, { nullable: true })
  stockStatus?: StockStatusEnum;

  @Field(() => Float)
  expectedQuantity!: number;

  @Field(() => Float)
  countedQuantity!: number;

  @Field(() => Float)
  difference!: number;

  @Field(() => StockAdjustmentReasonEnum, { nullable: true })
  reason?: StockAdjustmentReasonEnum;

  @Field(() => String, { nullable: true })
  customeResone?: string;

  @Field(() => String, { nullable: true })
  notes?: string;
}
@ObjectType()
export class OneStockAdjustmentResponse
  implements Partial<IStockAdjustment>
{
  @Field(() => ID)
  _id!: Types.ObjectId;

  @Field(() => OneWarehouseResponse)
  warehouseId!: Types.ObjectId | IWareHouse;

  @Field(() => String, { nullable: true })
  warehouseNameSnapshot?: string;

  @Field(() => [StockAdjustmentItemsResponse])
  items!: IStockAdjustmentItems[];

  @Field(() => SharedStatusEnum)
  status!: SharedStatusEnum;

  @Field(() => String)
  notes!: string;

  @Field(() => OneUserResponse, { nullable: true })
  createdBy!: Types.ObjectId | IUser;

  @Field(() => OneUserResponse, { nullable: true })
  updatedBy?: Types.ObjectId | IUser;

  @Field(() => OneUserResponse, { nullable: true })
  approvedBy!: Types.ObjectId | IUser;

  @Field(() => String)
  approvedAt!: Date;

  @Field(() => String)
  createdAt!: Date;

  @Field(() => String)
  updatedAt!: Date;
}
@ObjectType()
export class OneMessageResponse {
  @Field(()=> String)
  message! : string
}