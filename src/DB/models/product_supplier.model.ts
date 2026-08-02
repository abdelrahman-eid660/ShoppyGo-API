import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { SharedCurrencyEnum } from "src/common/enum";
import {IProductSupplier, IProductVariant, ISupplier, IUser } from "src/common/interface";

export type HProductSupplierDocument = HydratedDocument<IProductSupplier>
@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class ProductSupplier implements Partial<IProductSupplier>{

    @Prop({type : Types.ObjectId , ref : "ProductVariant", required : true})
    productVariantId?: Types.ObjectId | IProductVariant;
    @Prop({type : Types.ObjectId , ref : "Supplier" , required : true})
    supplierId!: Types.ObjectId | ISupplier;
    
    @Prop({type : Types.ObjectId , ref : "User" , required : true})
    createdBy! : Types.ObjectId | IUser
    @Prop({type : Types.ObjectId , ref : "User"})
    updatedBy? : Types.ObjectId | IUser

    @Prop({type : Number , required : true})
    costPrice!: number;
    @Prop({type : String , enum : SharedCurrencyEnum , default : SharedCurrencyEnum.EGP , required : true})
    currency!: SharedCurrencyEnum;
    @Prop({type : Number , required : true})
    minOrderQuantity?: number;
    @Prop({type : Number , required : true})
    leadTimeDays?: number;

    @Prop({type :String})
    variantTitleSnapshot? : string

    @Prop({type : Boolean , default : false , required : true})
    isActive!: boolean;
    @Prop({type : Boolean , default : false , required : true})
    isPrimary!: boolean;

    @Prop({type : Date})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const ProductSupplierSchema = SchemaFactory.createForClass(ProductSupplier)
ProductSupplierSchema.index({productVariantId : 1 , supplierId : 1},{unique : true , })
export const ProductSupplierModel = MongooseModule.forFeatureAsync([
    {
        name : ProductSupplier.name,
        useFactory : ()=> {
            return ProductSupplierSchema
        },
    }
])