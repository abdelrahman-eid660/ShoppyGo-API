import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IStockAlert } from 'src/common/interface';

export type HStockAlertDocument = HydratedDocument<IStockAlert>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class StockAlert implements Partial<IStockAlert> {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true })
  productVariantId?: Types.ObjectId | undefined;

  @Prop({ type: String })
  variantSnapshot?: string;

  @Prop({ type: Boolean, default: false })
  isNotified?: boolean;

  @Prop({ type: Date , index : true , default : Date.now , expires: 90 * 24 * 60 * 60 })
  createdAt!: Date;
  @Prop({ type: Date })
  updatedAt?: Date;
}

export const StockAlertSchema = SchemaFactory.createForClass(StockAlert);
StockAlertSchema.index({ productVariantId: 1, createdBy: 1 }, { unique: true });
export const StockAlertModel = MongooseModule.forFeature([
  {
    name: StockAlert.name,
    schema: StockAlertSchema,
  },
]);
