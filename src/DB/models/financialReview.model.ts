import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CurrencyEnum, FinancialCategoryEnum, FinancialSourceEnum, ReferenceModelEnum, SharedCurrencyEnum } from 'src/common/enum';
import { IFinancialReview } from 'src/common/interface';

export type HFinancialReviewDocument = HydratedDocument<FinancialReview>;

@Schema({ timestamps: true, strict: true })
export class FinancialReview implements Partial<IFinancialReview> {
  
  @Prop({ type: Types.ObjectId, ref : "WareHouse", index: true })
  warehouseId?: Types.ObjectId;
  
  @Prop({ type: Types.ObjectId , refPath : "referenceModel", required: true, index: true })
  referenceId!: Types.ObjectId;
  @Prop({ type: String, required: true, enum: ReferenceModelEnum})
  referenceModel!: ReferenceModelEnum;

  @Prop({ type: String, enum: FinancialCategoryEnum, required: true, index: true })
  category!: FinancialCategoryEnum;

  @Prop({ type: String, enum: FinancialSourceEnum, required: true, index: true })
  source!: FinancialSourceEnum;

  @Prop({ type: Number, required: true, min: 0 })
  amount!: number;

  @Prop({ type: String, enum : SharedCurrencyEnum , default : SharedCurrencyEnum.EGP, required: true })
  currency!: SharedCurrencyEnum;

  @Prop({ type: Number })
  costOfGoodsSold?: number;
  @Prop({ type: Number, default: 0 })
  shippingCostSnapshot?: number;
  @Prop({ type: Number, default: 0 })
  discountAmountSnapshot?: number;

  @Prop({ type: Types.ObjectId, ref: 'User', required: function(this : HFinancialReviewDocument){
    return !this.isSystem
  } })
  createdBy!: Types.ObjectId;
  @Prop({type : Boolean})
  isSystem?: boolean;

  @Prop({ type: String })
  notes?: string;
  
  @Prop({ type: Date })
  createdAt!: Date;
  @Prop({ type: Date })
  updatedAt?: Date;

}

export const FinancialReviewSchema = SchemaFactory.createForClass(FinancialReview);
FinancialReviewSchema.index({ category: 1, source: 1, createdAt: -1 });
export const FinancialReviewModel = MongooseModule.forFeature([
    {
        name : FinancialReview.name,
        schema : FinancialReviewSchema
    }
])