import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IWareHouse } from "src/common/interface";
import { Address } from "./user.model";
import { HydratedDocument, Types } from "mongoose";
import { generateSlug } from "src/common/utils/slug";
export type HWareHouseDocument = HydratedDocument<IWareHouse>

@Schema({
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  optimisticConcurrency: true,
  strict: true,
  strictQuery: true,
})
export class WareHouse implements Partial<IWareHouse>{
  @Prop({type : String , required: true , index : true ,unique: true})
  name!: string;
  @Prop({type : String})
  slug?: string;
  @Prop({type : String})
  coverImage?: string;
  @Prop({type : String , required: true,unique: true,trim: true , index : true})
  code!: string;
  @Prop()
  address!: Address;
  @Prop({type : [String] , required  :true , min : 1})
  phone!: string[];
  @Prop({type: Types.ObjectId,ref: "User",required: true , index : true})
  manager!: Types.ObjectId;
  @Prop({type : Boolean , required : true , default: true,})
  isActive!: boolean;
  @Prop({type : Boolean , default: false,})
  isMain!: boolean;
  @Prop({type : String  , minLength : 2 , maxLength : 50000})
  notes?: string;
  @Prop({type: Types.ObjectId,ref: "User",required: true , index : true})
  createdBy!: Types.ObjectId;
  @Prop({type: Types.ObjectId,ref: "User"})
  updatedBy?: Types.ObjectId;
}
export const WareHouseSchema = SchemaFactory.createForClass(WareHouse)
export const WareHouseModel = MongooseModule.forFeatureAsync([
    {
        name : WareHouse.name,
        useFactory :()=>{
            WareHouseSchema.pre("save" , function(this : HWareHouseDocument){
                if (this.name) {
                    this.slug = generateSlug(this.name)
                }
            })
            return WareHouseSchema
        }
    }
])