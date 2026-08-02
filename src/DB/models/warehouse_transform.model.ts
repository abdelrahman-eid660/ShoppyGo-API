import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {  SharedStatusEnum } from 'src/common/enum';
import {
  IProductVariant,
  IUser,
  IWareHouse,
  IWareHouseTransform,
  IWareHouseTransformItems,
} from 'src/common/interface';

export type HWareHouseTransformDocument = HydratedDocument<IWareHouseTransform>;

@Schema({
  _id: false,
})
export class WareHouseTransformItems implements Partial<IWareHouseTransformItems> {
  @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true })
  productVariantId!: Types.ObjectId | IProductVariant;

  @Prop({ type: Number, required: true , min:1 })
  quantity!: number;

  @Prop({ type: String, required: true })
  productVariantNameSnapshot! : string
}
const WareHouseTransformItemsSchema = SchemaFactory.createForClass(WareHouseTransformItems)

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class WareHouseTransform implements Partial<IWareHouseTransform> {
  @Prop({ type: Types.ObjectId, ref: 'WareHouse', required: true, index: true })
  fromWarehouseId!: Types.ObjectId | IWareHouse;
  @Prop({ type: Types.ObjectId, ref: 'WareHouse', required: true, index: true })
  toWarehouseId!: Types.ObjectId | IWareHouse;

  @Prop({ type: [WareHouseTransformItemsSchema], required: true })
  items!: IWareHouseTransformItems[];
  @Prop({ type: String })
  notes?: string;
  @Prop({type: String,enum: SharedStatusEnum,default: SharedStatusEnum.PENDING})
  status?: SharedStatusEnum;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId | undefined;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  approvedBy?: Types.ObjectId | IUser;
  @Prop({ type: Date })
  approvedAt?: Date;

  @Prop({ type: Date, index: true })
  createdAt!: Date;
  @Prop({ type: Date })
  updatedAt!: Date;

  @Prop({ type: Date })
  leaveAt!: Date;
  @Prop({ type: Date })
  transformedAt?: Date;
}
export const WareHouseTransformSchema = SchemaFactory.createForClass(WareHouseTransform);
export const WareHouseTransformModel = MongooseModule.forFeatureAsync([
  {
    name: WareHouseTransform.name,
    useFactory: () => {
      return WareHouseTransformSchema;
    },
  },
]);
