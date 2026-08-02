import {
  Field,
  Float,
  GraphQLISODateTime,
  ID,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { Types } from 'mongoose';
import {
  CancelReasonEnum,
  CashReturnMethodEnum,
  CurrencyEnum,
  OrderStatusEnum,
  PaymentMethodEnum,
  PaymentStatusEnum,
  RefundResoneEnum,
  RefundTypeEnum,
  RejectionReasonEnum,
} from 'src/common/enum';
import type {
  Address,
  IOrder,
  IOrderItem,
  IProductVariant,
  IUser,
  IWareHouse,
} from 'src/common/interface';
import { OneProductVariantsResponse } from 'src/modules/product-variant/entities/product-variant.entity';
import { PaginationInfo } from 'src/modules/product/entity/get-all-products';
import { OneAddressResponse, OneUserResponse } from 'src/modules/user/entity';
import { OneWarehouseResponse } from 'src/modules/warehouse/entities/warehouse.entity';
registerEnumType(RefundTypeEnum, { name: 'RefundType' });
registerEnumType(RefundResoneEnum, { name: 'RefundResone' });
registerEnumType(CurrencyEnum, { name: 'Currency' });
registerEnumType(CancelReasonEnum, { name: 'CancelResone' });
registerEnumType(PaymentMethodEnum, { name: 'PaymentMethod' });
registerEnumType(PaymentStatusEnum, { name: 'PaymentStatus' });
registerEnumType(OrderStatusEnum, { name: 'OrderStatus' });
registerEnumType(RejectionReasonEnum, { name: 'RejectionReason' });
registerEnumType(CashReturnMethodEnum, { name: 'CashReturnMethod' });

@ObjectType()
export class OneOrderItem {
  @Field(() => OneProductVariantsResponse , {nullable : true})
  variantId?: Types.ObjectId | IProductVariant;
  @Field(() => OneWarehouseResponse , {nullable : true})
  warehouseId?: Types.ObjectId | IWareHouse;
  @Field(() => String, { nullable: true })
  imageSnapshot?: string;
  @Field(() => String)
  skuSnapshot!: string;
  @Field(() => Float)
  priceSnapshot!: number;
  @Field(() => Number)
  quantity!: number;
  @Field(() => Number, { nullable: true })
  requestReturnQuantity?: number;
  @Field(() => Number, { nullable: true })
  refundedQuantity?: number;
  @Field(() => Float)
  subTotal!: number;
}

@ObjectType()
export class OneOrderResponse implements IOrder {
  @Field(() => ID)
  _id!: Types.ObjectId;
  @Field(() => String)
  orderNumber!: string;
  @Field(() => String, { nullable: true })
  intentId?: string;
  @Field(() => String, { nullable: true })
  stripeSessionId?: string;
  @Field(() => String, { nullable: true })
  stripeSessionUrl?: string;

  @Field(() => [OneOrderItem])
  items!: IOrderItem[];

  @Field(() => Float)
  subtotalAmount!: number;
  @Field(() => Float)
  shippingAmount!: number;
  @Field(() => Float)
  totalAmount!: number;
  @Field(() => OrderStatusEnum)
  status!: OrderStatusEnum;

  @Field(() => PaymentStatusEnum)
  paymentStatus!: PaymentStatusEnum;
  @Field(() => PaymentMethodEnum)
  paymentMethod!: PaymentMethodEnum;
  @Field(() => CurrencyEnum)
  currency!: CurrencyEnum;

  @Field(() => OneAddressResponse)
  shippingAddress!: Address;

  @Field(() => ID, { nullable: true })
  couponId?: Types.ObjectId;
  @Field(() => String, { nullable: true })
  couponCode?: string;
  @Field(() => Float, { nullable: true })
  discountAmount?: number;

  @Field(() => OneUserResponse, { nullable: true })
  confirmedBy?: Types.ObjectId | IUser;
  @Field(() => GraphQLISODateTime, { nullable: true })
  confirmedAt?: Date;

  @Field(() => OneUserResponse, { nullable: true })
  canceledBy?: Types.ObjectId | IUser;
  @Field(() => GraphQLISODateTime, { nullable: true })
  canceledAt?: Date;
  @Field(() => CancelReasonEnum, { nullable: true })
  cancelReason?: CancelReasonEnum;
  @Field(() => String, { nullable: true })
  cancelReasonOther?: string;
  @Field(() => Boolean, { nullable: true })
  canceledBySystem?: boolean;

  @Field(() => GraphQLISODateTime, { nullable: true })
  deliveredAt?: Date;
  @Field(() => GraphQLISODateTime, { nullable: true })
  refundedAt?: Date;
  @Field(() => RefundResoneEnum, { nullable: true })
  refundReason?: RefundResoneEnum;
  @Field(() => RefundTypeEnum, { nullable: true })
  refundType?: RefundTypeEnum;
  @Field(() => Float, { nullable: true })
  refundAmount?: number;
  @Field(() => String, { nullable: true })
  refundReasonOther?: string;

  @Field(() => OneUserResponse, { nullable: true })
  createdBy?: Types.ObjectId | IUser;
  @Field(() => OneUserResponse, { nullable: true })
  updatedBy?: Types.ObjectId | IUser;

  @Field(() => GraphQLISODateTime)
  createdAt!: Date;
  @Field(() => GraphQLISODateTime, { nullable: true })
  updateAt?: Date;
}

@ObjectType()
export class CheckoutOrderResponse {
  @Field(() => OneOrderResponse)
  order!: IOrder;
  @Field(() => String, { nullable: true })
  payment_url?: string | null;
}

@ObjectType()
export class OrderMessageResponse {
  @Field(() => String)
  message!: string;
}

export class AllOrdersResponse {
  @Field(() => [OneOrderResponse])
  docs!: IOrder[];
  @Field(() => PaginationInfo)
  pagination!: {
    currentPage?: number | undefined;
    limit: number;
    totalDocs?: number | undefined;
    totalPages?: number | undefined;
    hasNextPage: boolean | null;
    hasPreviousPage: boolean | null;
  };
}
