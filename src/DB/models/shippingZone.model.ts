import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { governorateEnum } from 'src/common/enum';
import { IShippingZone } from 'src/common/interface';

export type HShippingZoneDocument = HydratedDocument<IShippingZone>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class ShippingZone implements Partial<IShippingZone> {
  @Prop({ type: Number, required: true, min: 1 })
  estimatedDays!: number;
  @Prop({ type: String, enum: governorateEnum , unique : true })
  governorate!: governorateEnum;
  @Prop({ type: Boolean, default: false, required: true })
  isActive!: boolean;

  @Prop({ type: Number, required: true })
  price!: number;
  @Prop({ type: Number, required: true, default: 0 })
  mainCost!: number;

  @Prop({type : Types.ObjectId , ref : "User" , required : true})
  createdBy! : Types.ObjectId
  @Prop({type : Types.ObjectId , ref : "User"})
  updatedBy? : Types.ObjectId

  @Prop({ type: Date, index: true })
  createdAt!: Date;
  @Prop({ type: Date })
  updatedAt!: Date;
}
export const ShippingZoneSchema = SchemaFactory.createForClass(ShippingZone);
export const ShippingZoneModel = MongooseModule.forFeature([
  { name: ShippingZone.name, schema: ShippingZoneSchema },
]);
