import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import {IReview } from 'src/common/interface';

export type HReviewDocument = HydratedDocument<IReview>;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class Review implements Partial<IReview> {
  @Prop({type: Types.ObjectId,ref: 'ProductVariant',required: true})
  variantId!: Types.ObjectId;
  @Prop({type: Types.ObjectId,ref: 'Product',required: true})
  productId!: Types.ObjectId;
  @Prop({ type: String })
  variantSnapshot?: string;
  @Prop({ type: String, minLength: 2, maxLength: 500, trim: true })
  comment?: string;
  @Prop({ type: Number, min: 1, max: 5, required: true, index: true })
  rating!: number;
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy!: Types.ObjectId;
  @Prop({ type: Types.ObjectId, ref: 'User' })
  updatedBy?: Types.ObjectId;
  @Prop({ type : Boolean ,  default: true })
  isApproved?: boolean;
  @Prop({ type: Date })
  createdAt!: Date;
  @Prop({ type: Date })
  updatedAt?: Date;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
ReviewSchema.index({ variantId: 1, createdBy: 1 }, { unique: true });
ReviewSchema.index({ productId: 1 });
export const ReviewModel = MongooseModule.forFeature([
  {
    name: Review.name,
    schema: ReviewSchema,
  },
]);
