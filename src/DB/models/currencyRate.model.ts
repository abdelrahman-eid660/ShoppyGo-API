import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CurrencyEnum } from 'src/common/enum';
import { ICurrencyItem, ICurrencyRate } from 'src/common/interface';
export type HCurrencyRateDocument = HydratedDocument<ICurrencyRate>

@Schema({ _id: false })
class CurrencyItemSchema implements ICurrencyItem {
  @Prop({ type: String, required: true , index : true , unique : true , uppercase : true})
  code!: string;

  @Prop({ type: String, required: true , index : true })
  name!: string;

  @Prop({ type: Number, required: true, default: 1 })
  exchangeRate!: number;

  @Prop({ type: Date, default: Date.now })
  updatedAt!: Date;
}

@Schema({ 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class CurrencyRate implements Partial<ICurrencyRate> {
  @Prop({ type: String, required: true, enum : CurrencyEnum , default: CurrencyEnum.EGP, index : true , unique : true })
  baseCurrency!: CurrencyEnum;

  @Prop({ type: [CurrencyItemSchema], default: [] })
  currencies!: ICurrencyItem[];

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: Types.ObjectId , index : true, ref: 'User' , required : true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const CurrencyRateSchema = SchemaFactory.createForClass(CurrencyRate);
export const CurrencyRateModel = MongooseModule.forFeature([
    {
        name : CurrencyRate.name,
        schema : CurrencyRateSchema
    }
]);