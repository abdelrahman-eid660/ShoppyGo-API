import { BadRequestException, NotFoundException } from "@nestjs/common";
import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import type{ IProductAttribute, IProductVariant, IUser } from "src/common/interface";
import { generateSlug } from "src/common/utils/slug";

export type HProductVariantDocument = HydratedDocument<IProductVariant>
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
export class ProductVariant implements Partial<IProductVariant>{

    @Prop({type : String , required : true , unique : true , minLength : 4 , maxLength : 15})
    sku!: string;
    
    @Prop({type : String , minLength : 2 , maxLength : 5000})
    description?: string;

    @Prop({type : Number , required : true})
    price!: number;
    @Prop({type : Number , default : 0})
    stock!: number;

    @Prop({type : [String] , required : true})
    images!: string[];
    
    @Prop({type : [ProductAttribute]})
    attributes!: IProductAttribute[];

    @Prop({type : Types.ObjectId , ref : "Product" , index : true , required : true})
    productId!: Types.ObjectId;
    @Prop({type : Types.ObjectId , ref : "Brand" , index : true , required : true})
    brandId!: Types.ObjectId;
    @Prop({type : Types.ObjectId , ref : "Category" , index : true , required : true})
    categoryId!: Types.ObjectId;
    @Prop({type : Types.ObjectId , ref : "User" , index : true , required : true})
    createdBy!: Types.ObjectId | IUser;
    @Prop({type : Types.ObjectId , ref : "User" , index : true })
    updatedBy?: Types.ObjectId | IUser | undefined;
    
    @Prop({type : Boolean , default  : false})
    isPublished!: boolean;

    @Prop({type : Boolean , default  : false})
    isDefualt?: boolean;

    @Prop({type : Number , min : 0 , max : 5})
    rating?: number;
    @Prop({ type: Number })
    reviewCount?: number;

    @Prop({type : String})
    slug!: string;
    @Prop({type : Date})
    deletedAt?: Date ;
    @Prop({type : Date})
    restoredAt?: Date ;
    @Prop({type : Date})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant)
export const ProductVariantModel = MongooseModule.forFeatureAsync([
    {
        name : ProductVariant.name,
        useFactory :()=>{
            ProductVariantSchema.pre("save" , function(this : HProductVariantDocument){
                if (this.sku) {
                    this.slug = generateSlug(this.sku)
                }
            })
            ProductVariantSchema.pre(['find', 'findOne', 'countDocuments'], function () {
                const query = this.getQuery();
                if (query.paranoid === false) {
                    this.setQuery({ ...query });
                } else {
                    this.setQuery({ ...query, deletedAt: { $exists: false } });
                }
            });
            ProductVariantSchema.pre(['updateOne', 'findOneAndUpdate'], async function () {
                const update = this.getUpdate() as HydratedDocument<IProductVariant>;
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
            ProductVariantSchema.pre(['deleteOne', 'findOneAndDelete'], async function () {
                const query = this.getQuery();
                const ProductVariant = await this.model.findOne(query);
                if (!ProductVariant) {
                    throw new NotFoundException('ProductVariant not found');
                }
                const force = query?.force;
                if (!ProductVariant.deletedAt && !force) {
                  throw new BadRequestException('ProductVariant is not soft deleted. Use force delete to permanently remove it.');
                }
            });
            ProductVariantSchema.pre('aggregate', function () {
                const opts = this.options || {};
                if (opts.allowDeleted === false) {
                    this.pipeline().unshift({
                        $match: { deletedAt: { $exists: false } },
                    });
                }
            });
            return ProductVariantSchema
        }
    }
])