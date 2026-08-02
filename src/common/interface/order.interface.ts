import { Types } from "mongoose";
import { Address, IUser } from "./user.interface";
import {  CancelReasonEnum, CurrencyEnum, OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum, RefundResoneEnum, RefundTypeEnum } from "../enum";
export interface IOrderItem {
  variantId: Types.ObjectId;
  warehouseId: Types.ObjectId;
  imageSnapshot: string;
  skuSnapshot: string;
  priceSnapshot: number;
  quantity: number;
  requestReturnQuantity?: number;
  refundedQuantity?: number;
  subTotal : number
}
export interface IOrder {
  _id : Types.ObjectId
  orderNumber: string;
  intentId?: string;
  // shipmentId? : Types.ObjectId
  stripeSessionId?: string;
  stripeSessionUrl?: string;



  items: IOrderItem[];

  subtotalAmount: number;
  shippingAmount: number;
  totalAmount: number;
  status: OrderStatusEnum;


  paymentStatus: PaymentStatusEnum;
  paymentMethod: PaymentMethodEnum;
  currency : CurrencyEnum

  shippingAddress: Address;

  couponId? : Types.ObjectId
  couponCode?: string
  discountAmount?: number;

  confirmedBy? : Types.ObjectId | IUser
  confirmedAt? : Date

  canceledBy? : Types.ObjectId | IUser
  canceledAt? : Date
  cancelReason? : CancelReasonEnum
  cancelReasonOther?: string;
  canceledBySystem?: boolean;
  
  deliveredAt?: Date;
  refundedAt?: Date;
  refundReason? : RefundResoneEnum
  refundType? : RefundTypeEnum
  refundAmount? : number
  refundReasonOther?: string;

  createdBy? : Types.ObjectId | IUser
  updatedBy? : Types.ObjectId | IUser

  createdAt: Date;
  updateAt?: Date;
}