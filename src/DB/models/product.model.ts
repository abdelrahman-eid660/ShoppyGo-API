import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { IProduct, IProductAttribute } from 'src/common/interface';
import { generateSlug } from 'src/common/utils/slug';
export type HProductDocument = HydratedDocument<IProduct>
@Schema({ _id: false })
class ProductAttribute {
  @Prop({ required: true })
  key!: string;

  @Prop({ required: true })
  label!: string;

  @Prop()
  value!: string;

  @Prop()
  unit?: string;
}

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class Product implements Partial<IProduct> {
    @Prop({ type: String, unique: true, index: true, required: true,minLength: 2,maxLength: 50})
    title!: string;
    @Prop({ type: String,minLength: 2,maxLength: 5000})
    description!: string;
    @Prop({type : String})
    image!: string;
    @Prop({type : [String]})
    gallery!: string[];
    @Prop({type : Number , required : true})
    basePrice!: number;
    @Prop({ type: Types.ObjectId, ref: 'Brand', index: true , required : true })
    brandId!: Types.ObjectId;
    @Prop({ type: Types.ObjectId, ref: 'Category', index: true , required : true })
    categoryId!: Types.ObjectId;
    @Prop({ type: Types.ObjectId, ref: 'User' , required : true })
    createdBy!: Types.ObjectId;
    @Prop({ type: Types.ObjectId, ref: 'User'})
    updatedBy!: Types.ObjectId;
    @Prop({ type: Boolean, default : false})
    isPublished?: boolean;
    @Prop({ type: [ProductAttribute] })
    attributes?: IProductAttribute[];
    @Prop({type : Number , min : 0 , max : 5})
    rating?: number;
    @Prop({ type: Number })
    reviewCount?: number;
    @Prop({ type: Date })
    deletedAt?: Date;
    @Prop({ type: Date })
    restoredAt?: Date;
}
export const ProductSchema = SchemaFactory.createForClass(Product)
export const ProductModel = MongooseModule.forFeatureAsync([
    {
        name : Product.name,
        useFactory:() =>{
          ProductSchema.pre('save' , function(){
          })
            ProductSchema.pre(['find', 'findOne', 'countDocuments'], function () {
                    const query = this.getQuery();
                    if (query.paranoid === false) {
                      this.setQuery({ ...query });
                    } else {
                      this.setQuery({ ...query, deletedAt: { $exists: false } });
                    }
            });
            ProductSchema.pre(['updateOne', 'findOneAndUpdate'], async function () {
                    const update = this.getUpdate() as HydratedDocument<IProduct>;
                    const query = this.getQuery();
                    if (update.restoredAt) {
                      this.setQuery({ ...this.getQuery(), deletedAt: { $exists: true } });
                      this.setUpdate({ ...update, $unset: { deletedAt: 1 } });
                    }
                    if (query.paranoid === false) {
                      this.setQuery({ ...query });
                    } else {
                      this.setQuery({ ...query, deletedAt: { $exists: false } });
                    }
            });
            ProductSchema.pre(['deleteOne', 'findOneAndDelete'], async function () {
                    const query = this.getQuery();
                    const Product = await this.model.findOne(query);
                    if (!Product) {
                      throw new NotFoundException('Product not found');
                    }
                    const force = query?.force;
                    if (!Product.deletedAt && !force) {
                      throw new BadRequestException(
                        'Product is not soft deleted. Use force delete to permanently remove it.'
                      );
                    }
            });
            ProductSchema.pre('aggregate', function () {
                    const opts = this.options || {};
                    if (opts.allowDeleted === false) {
                      this.pipeline().unshift({
                        $match: { deletedAt: { $exists: false } },
                      });
                    }
            });
            return ProductSchema
        },
    }
])