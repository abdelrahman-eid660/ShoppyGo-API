import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { ISupplier, IUser } from "src/common/interface";

export type HSupplierDocument = HydratedDocument<ISupplier>;
class Address {
  @Prop()
  country!: string;

  @Prop()
  governorate!: string;

  @Prop()
  street!: string;
  @Prop()
  zone!: string;

  @Prop()
  postalCode!: number;
}
@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class Supplier implements Partial<ISupplier>{
    @Prop({type : String , unique : true , index : true, required : true , minLength : 2 , maxLength : 100})
    name!: string;
    @Prop({type : Address , required : true})
    address!: Address;
    @Prop({type : String , required : true , unique : true , index : true})
    email!: string;
    @Prop({type : Boolean , required : true , default : false})
    isActive!: boolean | undefined;
    @Prop({type : [String] , required : true , index : true})
    phone!: string[];
    @Prop({type : Number})
    rating?: number | undefined;
    @Prop({type : Types.ObjectId , ref : "User" , required : true})
    createdBy!: Types.ObjectId | IUser;
    @Prop({type : Types.ObjectId , ref : "User"})
    updatedBy?: Types.ObjectId | IUser;
    @Prop({type : Date})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const SupplierSchema = SchemaFactory.createForClass(Supplier)
export const SupplierModel = MongooseModule.forFeatureAsync([
    {
        name : Supplier.name,
        useFactory :()=>{
            return SupplierSchema
        }
    }
])