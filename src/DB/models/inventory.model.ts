import { MongooseModule, Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { IInventory, IWareHouse } from "src/common/interface";

export type HInventoryDocument = HydratedDocument<IInventory>

@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class Inventory implements Partial<IInventory>{
    
    @Prop({type : Types.ObjectId , ref : "ProductVariant" , required : true , index : true})
    productVariantId!: Types.ObjectId;
    @Prop({type : Types.ObjectId , ref : "Warehouse" , required : true , index :true})
    wareHouseId!: Types.ObjectId | IWareHouse;

    @Prop({type : Number , required : true , default : 5})
    lowStockThreshold!: number;
    @Prop({type : Number , required : true , default : 0})
    quantity!: number;
    @Prop({type : Number , required : true , default : 0})
    reserved!: number;
    @Prop({type : Number , required : true , default : 0})
    availableQuantity!: number;
    @Prop({type : Number , default : 0})
    sold?: number;
    @Prop({type : Number , default : 0})
    costPrice?: number;

    @Prop({type : String , index : true})
    skuSnapshot? : string
    @Prop({type : String , index :true})
    productTitleSnapshot? : string
    @Prop({type : String , index :true})
    governorateWarehouseSnapshot? : string
    
    @Prop({type : Types.ObjectId , ref : "User" , required : true})
    createdBy!: Types.ObjectId;
    @Prop({type : Types.ObjectId , ref : "User"})
    updatedBy?: Types.ObjectId | undefined;

    @Prop({type : Date , index : true})
    lastStockUpdate?: Date;

    @Prop({type : Date})
    deletedAt?: Date;
    @Prop({type : Date})
    restoredAt?: Date;

    @Prop({type : Date , index : true})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const InventorySchema = SchemaFactory.createForClass(Inventory)
export const InventoryModel = MongooseModule.forFeatureAsync([
    {
        name : Inventory.name,
        useFactory :()=>{
            return InventorySchema
        }
    }
])