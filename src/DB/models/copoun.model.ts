import {
  MongooseModule,
  Prop,
  raw,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { CouponTypeEnum } from 'src/common/enum';
import type { ICoupon } from 'src/common/interface';
import { generateSlug } from 'src/common/utils/slug';
export type HCouponDocument = HydratedDocument<ICoupon>;
@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class Coupon implements Partial<ICoupon> {
  @Prop({ type: String, required: true, unique: true, index: true, trim: true })
  code!: string;
  @Prop({ type: String, required: true })
  image!: string;
  @Prop({ type: String })
  slug?: string;
  @Prop({ type: String, enum: CouponTypeEnum, required: true, index: true })
  type!: CouponTypeEnum;
  @Prop({ type: String })
  description?: string;
  @Prop({ type: Types.ObjectId , ref : "Order" })
  orderId?: Types.ObjectId
  @Prop({ type: Number, required: true })
  minOrderAmount!: number;
  @Prop({ type: Number, required: function(this : HCouponDocument){
    return this.type === CouponTypeEnum.PERCENT
  }})
  maxDiscountAmount?: number;
  @Prop({ type: Number, required: true, min: 1 })
  usageLimit!: number;
  @Prop({ type: Number, default: 0 })
  usedCount?: number;
  @Prop({ type: Number, required: true })
  value!: number;

  @Prop({ type: Boolean, default: false })
  isActive?: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', index: true, required: true })
  createdBy!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy!: Types.ObjectId;

  @Prop({ type: Date, required: true })
  startAt!: Date;
  @Prop({ type: Date, required: true })
  expiresAt!: Date;
  @Prop({ type: Date, index: true })
  createdAt!: Date;
  @Prop({ type: Date })
  updatedAt!: Date;
}
export const CouponSchema = SchemaFactory.createForClass(Coupon);
export const CouponModel = MongooseModule.forFeatureAsync([
  {
    name: Coupon.name,
    useFactory: () => {
      CouponSchema.pre('save', function (this: HCouponDocument) {
        if (this.code) {
          this.slug = generateSlug(this.code);
        }
      });
      return CouponSchema;
    },
  },
]);
