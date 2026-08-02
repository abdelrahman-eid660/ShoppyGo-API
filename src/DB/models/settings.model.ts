import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CurrencyEnum, SharedCurrencyEnum } from 'src/common/enum';
import { ICurrencyItem, ISettings } from 'src/common/interface';

export type HSettingsDocument = HydratedDocument<ISettings>;

@Schema({ _id: false })
class CurrencyItemSchema implements ICurrencyItem {
  @Prop({ type: String, required: true, index: true, uppercase: true })
  code!: string;

  @Prop({ type: String })
  name?: string;

  @Prop({ type: Number, default: 14 })
  returnPolicyDays?: number;

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
export class Settings implements Partial<ISettings> {
  @Prop({ type: String, required: true, default: 'ShoppyGo', trim: true })
  projectName!: string;

  @Prop({ type: String, default: '' })
  logoUrl?: string;

  @Prop({ type: String, required: true, enum: SharedCurrencyEnum, default: SharedCurrencyEnum.EGP, index: true, unique: true })
  baseCurrency!: SharedCurrencyEnum;

  @Prop({ type: [CurrencyItemSchema], default: [] })
  currencies!: ICurrencyItem[];

  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
}

export const SettingsSchema = SchemaFactory.createForClass(Settings);

export const SettingsModel = MongooseModule.forFeature([
  {
    name: Settings.name,
    schema: SettingsSchema,
  },
]);