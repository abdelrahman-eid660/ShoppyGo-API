import { Types } from "mongoose";
import { RefundStatusEnum } from "../enum";

export interface IRefund {
  orderId: Types.ObjectId;
  paymentId: Types.ObjectId;

  userId: Types.ObjectId;

  amount: number;

  reason: string;

  refundedAt?: Date

  status: RefundStatusEnum;
}