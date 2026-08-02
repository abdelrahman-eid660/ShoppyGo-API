import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { CurrencyEnum, PaymentMethodEnum, PaymentStatusEnum, ProviderPaymentEnum } from "src/common/enum";
import { IPayment } from "src/common/interface";
import { Schema as MongooseSchema } from "mongoose";
export type HPaymentDocument = HydratedDocument<IPayment>

@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class Payment implements Partial<IPayment>{
    @Prop({type : Types.ObjectId , ref : "Order" , index : true , required : true})
    orderId?: Types.ObjectId ;
    @Prop({type : String})
    intentId?: string ;
    
    @Prop({type : String})
    failureReason?: string ;

    @Prop({type : Number , required : true})
    amount!: number ;
    @Prop({type : Number , default : 0})
    refundedAmount?: number ;

    @Prop({type : MongooseSchema.Types.Mixed})
    metadata?: Record<string, any> ;

    @Prop({ type: String , enum : ProviderPaymentEnum , default : ProviderPaymentEnum.STRIPE})
    provider?: ProviderPaymentEnum ;
    @Prop({ type: String , enum : PaymentStatusEnum , default : PaymentStatusEnum.PENDING})
    status?: PaymentStatusEnum ;
    @Prop({ type: String , enum : CurrencyEnum , default : CurrencyEnum.EGP})
    currency?: CurrencyEnum ;
    @Prop({ type: String , enum : PaymentMethodEnum})
    paymentMethodType?: PaymentMethodEnum ;

    @Prop({type : Date})
    paidAt?: Date ;

    @Prop({type: Types.ObjectId,ref: 'User',required: function(this: HPaymentDocument) { return !this.isSystemAction}})
    createdBy?: Types.ObjectId;

    @Prop({ type: Boolean, default: false })
    isSystemAction?: boolean;
    
    @Prop({type : Types.ObjectId , ref : "User"})
    updatedBy?: Types.ObjectId;

    @Prop({type : Date , index : true})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const PaymentSchema = SchemaFactory.createForClass(Payment)
export const PaymentModel = MongooseModule.forFeature([{name : Payment.name , schema : PaymentSchema}])