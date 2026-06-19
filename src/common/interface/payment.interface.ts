import { Types } from "mongoose";
import { PaymentStatusEnum, ProviderPaymentEnum } from "../enum";

export interface IPayment {
  orderId: Types.ObjectId;
  userId: Types.ObjectId;

  amount: number;

  currency: string;

  status: PaymentStatusEnum;

  provider: ProviderPaymentEnum;

  transactionId?: string;

  paidAt?: Date

  createdAt: Date;
}