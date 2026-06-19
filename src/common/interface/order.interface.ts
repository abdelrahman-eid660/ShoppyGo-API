import { Types } from "mongoose";
import { Address } from "./user.interface";
import { OrderStatusEnum, PaymentStatusEnum } from "../enum";
export interface IOrderItem {
  productId: Types.ObjectId;
  variantId: Types.ObjectId;

  titleSnapshot: string;

  priceSnapshot: number;

  quantity: number;
}
export interface IOrder {
  userId: Types.ObjectId;

  items: IOrderItem[];

  totalAmount: number;

  status: OrderStatusEnum;

  paymentStatus: PaymentStatusEnum;

  shippingAddress: Address;

  couponId?: Types.ObjectId

  discountAmount: number

  createdAt: Date;
}