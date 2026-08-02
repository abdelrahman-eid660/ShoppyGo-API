import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { IBrand, IBrandSupplier, ISupplier, IUser } from "src/common/interface";

export type HBrandSupplierDocument = HydratedDocument<IBrandSupplier>

@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class BrandSupplier implements Partial<IBrandSupplier>{

    @Prop({type : Types.ObjectId , ref : "Supplier" , required : true})
    supplierId!: Types.ObjectId | ISupplier ;
    @Prop({type : Types.ObjectId , ref : "Brand"  , required : true})
    brandId!: Types.ObjectId | IBrand ;

    @Prop({type : Boolean , required : true , default : true})
    isActive!: boolean ;
    @Prop({type : Boolean , required : true , default : false})
    isPrimary!: boolean ;

    @Prop({type : String , required : true})
    supplierNameSnapshot! : string
    @Prop({type : String , required : true})
    brandNameSnapshot! : string

    @Prop({type : Types.ObjectId , ref : "User" , index : true , required : true})
    createdBy!: Types.ObjectId | IUser;
    @Prop({type : Types.ObjectId , ref : "User" , index : true })
    updatedBy?: Types.ObjectId | IUser ;

    @Prop({type : Date , index : true})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const BrandSupplierSchema = SchemaFactory.createForClass(BrandSupplier)
BrandSupplierSchema.index({brandId : 1 , supplierId : 1} , {unique : true})
export const BrandSupplierModel = MongooseModule.forFeature([{name : BrandSupplier.name , schema : BrandSupplierSchema}])