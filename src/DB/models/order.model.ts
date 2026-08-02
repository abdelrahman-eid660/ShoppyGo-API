import {
  MongooseModule,
  Prop,
  raw,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CancelReasonEnum, CurrencyEnum, OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum, RefundResoneEnum, RefundTypeEnum } from 'src/common/enum';
import type {Address , IOrder, IOrderItem } from 'src/common/interface';
import { Address as AdressSchema } from './user.model';
export type HOrderDocument = HydratedDocument<IOrder>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class Order implements Partial<IOrder> {

  @Prop({ type: String, required: true, unique: true, index: true, trim: true })
  orderNumber!: string;
  @Prop({ type: String })
  intentId?: string;
  @Prop({ type: String })
  stripeSessionId?: string;
  @Prop({ type: String })
  stripeSessionUrl?: string;
  

  @Prop([{
    type : raw({
      variantId: {type : Types.ObjectId , ref : "ProductVariant" , required : true},
      warehouseId: {type : Types.ObjectId , ref : "WareHouse" , required : true},
      imageSnapshot: {type : String , required : true},
      skuSnapshot: {type : String , required : true},
      priceSnapshot: {type : Number , required : true},
      quantity: {type : Number , required : true},
      requestReturnQuantity: {type : Number , default : 0},
      refundedQuantity: {type : Number , default : 0},
      subTotal : {type : Number , required : true},
    }),
    required : true, _id : false
  }])
  items!: IOrderItem[] ;

  @Prop({type  :String , enum : CurrencyEnum , default : CurrencyEnum.EGP , required : true})
  currency!: CurrencyEnum ;
  @Prop({type  :String , enum : PaymentMethodEnum , default : PaymentMethodEnum.CASH})
  paymentMethod!: PaymentMethodEnum ;
  @Prop({type  :String , enum : PaymentStatusEnum , default : PaymentStatusEnum.PENDING})
  paymentStatus?: PaymentStatusEnum ;
  
  @Prop({type  : AdressSchema , required : true})
  shippingAddress!: Address ;
  @Prop({type  : Number , required : true})
  shippingAmount!: number ;
  
  @Prop({ type: Types.ObjectId, ref: 'Coupon' })
  couponId?: Types.ObjectId;
  @Prop({ type: String })
  couponCode?: string;
  @Prop({type  : Number , required : true})
  subtotalAmount!: number ;
  @Prop({type : Number , required : true , default : 0})
  discountAmount!: number ;
  @Prop({type  : Number , required : true})
  totalAmount!: number ;


  @Prop({ type: Types.ObjectId, ref: 'User', index: true, required: true })
  createdBy!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
  
  @Prop({type  :String , enum : OrderStatusEnum , default : OrderStatusEnum.PENDING})
  status!: OrderStatusEnum;

  @Prop({ type: Date })
  canceledAt?: Date;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  canceledBy?: Types.ObjectId;
  @Prop({ type: String , enum : CancelReasonEnum})
  cancelReason?: CancelReasonEnum;
  @Prop({ type: String })
  cancelReasonOther?: string;
  @Prop({ type: Boolean })
  canceledBySystem?: boolean;

  @Prop({ type: Date })
  confirmedAt?: Date;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  confirmedBy?: Types.ObjectId;

  @Prop({ type: Date })
  deliveredAt?: Date ;

  @Prop({ type: Date })
  refundedAt?: Date ;
  @Prop({ type: String , enum : RefundResoneEnum})
  refundReason?: RefundResoneEnum;
  @Prop({ type: String , enum : RefundTypeEnum})
  refundType?: RefundTypeEnum;
  @Prop({ type: String })
  refundReasonOther?: string;
  @Prop({ type: Number })
  refundAmount?: number;

  @Prop({ type: Date, index: true })
  createdAt!: Date;
  @Prop({ type: Date })
  updatedAt!: Date;
}
export const OrderSchema = SchemaFactory.createForClass(Order);
export const OrderModel = MongooseModule.forFeature([{name : Order.name , schema : OrderSchema}])
