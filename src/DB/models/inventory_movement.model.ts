import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { InventoryMovementType, ReferenceModelEnum } from "src/common/enum";
import { IInventoryMovement, IWareHouse } from "src/common/interface";

export type HInventoryMovementDocument = HydratedDocument<IInventoryMovement>

@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class InventoryMovement implements Partial<IInventoryMovement>{
    
    @Prop({type : Types.ObjectId , ref : "ProductVariant" , required : true , index : true})
    productVariantId!: Types.ObjectId;
    @Prop({type : Types.ObjectId , ref : "WareHouse" , required : true , index :true})
    wareHouseId!: Types.ObjectId | IWareHouse;

    @Prop({type : String , enum : InventoryMovementType , index : true , required : true})
    type!: InventoryMovementType;
    @Prop({type : Types.ObjectId , refPath : "referenceModel" , required : true})
    referenceId!: Types.ObjectId;
    @Prop({type : String ,enum : ReferenceModelEnum , required : true})
    referenceModel!: ReferenceModelEnum;
    
    @Prop({type : String , index : true})
    skuSnapshot? : string
    @Prop({type : String , index : true})
    wareHouseSnapshot? : string
    @Prop({type : String , index : true})
    productTitleSnapshot? : string
    
    @Prop({type : Number , required : true , default : 0})
    beforeQuantity!: number | undefined;
    @Prop({type : String , required : true})
    quantity!: string;
    @Prop({type : Number , required : true , default : 0})
    afterQuantity!: number | undefined;
    
    @Prop({type: Types.ObjectId, ref: 'User', 
        required: function(this : HInventoryMovementDocument) { return !this.isSystemAction; }
    })
    createdBy?: Types.ObjectId;

    @Prop({ type: Boolean, default: false })
    isSystemAction?: boolean;
    @Prop({type : Types.ObjectId , ref : "User"})
    updatedBy?: Types.ObjectId | undefined;

    @Prop({type : Date , index : true})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const InventoryMovementSchema = SchemaFactory.createForClass(InventoryMovement)
export const InventoryMovementModel = MongooseModule.forFeatureAsync([
    {
        name : InventoryMovement.name,
        useFactory :()=>{
            return InventoryMovementSchema
        }
    }
])