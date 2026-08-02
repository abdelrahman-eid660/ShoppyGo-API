import { Types } from "mongoose";
import { CurrencyEnum, PaymentMethodEnum, PaymentStatusEnum, ProviderPaymentEnum } from "../enum";
import { IUser } from "./user.interface";
import { IOrder } from "./order.interface";

export interface IPayment {
  orderId: Types.ObjectId | IOrder;
  createdBy: Types.ObjectId | IUser;
  isSystemAction? : boolean
  updatedBy?: Types.ObjectId | IUser;
  
  amount: number;
  refundedAmount?: number;
  
  currency: CurrencyEnum;
  status: PaymentStatusEnum;
  provider: ProviderPaymentEnum
  
  intentId?: string; 
  
  paymentMethodType?: PaymentMethodEnum; 

  failureReason?: string; 
  
  metadata?: Record<string, any>; 
  
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}