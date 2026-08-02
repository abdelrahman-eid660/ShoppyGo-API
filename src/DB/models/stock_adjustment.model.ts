import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {  SharedStatusEnum, StockAdjustmentReasonEnum, StockStatusEnum } from 'src/common/enum';
import {
  IProductVariant,
  IUser,
  IWareHouse,
  IStockAdjustment,
  IStockAdjustmentItems,
} from 'src/common/interface';

export type HStockAdjustmentDocument = HydratedDocument<IStockAdjustment>;
export type HStockAdjustmentItemsDocument = HydratedDocument<IStockAdjustmentItems>;

@Schema({
  _id: false,
})
export class StockAdjustmentItems implements Partial<IStockAdjustmentItems> {
    @Prop({ type: Types.ObjectId, ref: 'ProductVariant', required: true, index: true })
    productVariantId!: Types.ObjectId | IProductVariant;
    @Prop({type : Number , required : true})
    countedQuantity!: number;
    @Prop({type : Number , required : true})
    expectedQuantity!: number;
    @Prop({type : Number , required : true})
    difference!: number;
    @Prop({type : String , enum : StockAdjustmentReasonEnum , required : function(this : HStockAdjustmentItemsDocument){
        return this.difference !== 0
    }})
    reason?: StockAdjustmentReasonEnum;
    @Prop({ type: String , required : function(this : HStockAdjustmentItemsDocument){
        return this.reason === StockAdjustmentReasonEnum.OTHER
    }})
    customeReson?: string;
    @Prop({ type: String })
    notes?: string;
    @Prop({ type: String , index : true})
    skuSnapshot? : string
    @Prop({ type: String , enum : StockStatusEnum , default : StockStatusEnum.BALANCED , index : true})
    stockStatus? : StockStatusEnum
}
const StockAdjustmentItemsSchema = SchemaFactory.createForClass(StockAdjustmentItems)

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class StockAdjustment implements Partial<IStockAdjustment> {

  @Prop({ type: Types.ObjectId, ref: 'WareHouse', required: true, index: true })
  warehouseId!: Types.ObjectId | IWareHouse;
  @Prop({ type: String , index: true })
  warehouseNameSnapshot? : string

  @Prop({ type: [StockAdjustmentItemsSchema], required: true })
  items!: IStockAdjustmentItems[];
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
}
export const StockAdjustmentSchema = SchemaFactory.createForClass(StockAdjustment);
export const StockAdjustmentModel = MongooseModule.forFeatureAsync([
  {
    name: StockAdjustment.name,
    useFactory: () => {
      return StockAdjustmentSchema;
    },
  },
]);
