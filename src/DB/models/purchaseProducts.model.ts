import { MongooseModule, Prop, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { PurchaseProcessStatusEnum, SharedCurrencyEnum } from "src/common/enum";
import { IPurchaseProducts, ISupplier, IPurchaseItems, IProductVariant, IUser, IWareHouse } from "src/common/interface";

export type HPurchaseProductsDocument = HydratedDocument<IPurchaseProducts>
@Schema()
export class PurchaseItems implements IPurchaseItems {
    @Prop({type : Types.ObjectId , ref : "ProductVariant"})
    productVariantId! : Types.ObjectId
    @Prop({type : Number , required : true})
    orderedQuantity!: number;
    @Prop({type : Number , default : 0})
    receivedQuantity!: number;
    @Prop({type : Number , required : true})
    costPrice!: number;
    @Prop({type : String , required : true})
    skuSnapshot! : string
    @Prop({type  :Number , required : true , default : 0})
    remainingQuantity! : number
    @Prop({type  :String , enum : SharedCurrencyEnum , required : true})
    currencySnapshot! : SharedCurrencyEnum
}
export const PruchaseItemsSchema = SchemaFactory.createForClass(PurchaseItems)
@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class PurchaseProducts implements Partial<IPurchaseProducts>{
    @Prop({type : [PruchaseItemsSchema] , required : true})
    items!: IPurchaseItems[];
    
    @Prop({type : String , enum : PurchaseProcessStatusEnum , default : PurchaseProcessStatusEnum.PENDING})
    status!: PurchaseProcessStatusEnum;

    @Prop({type : Types.ObjectId , ref : "Supplier" , required : true , index :true})
    supplierId!: Types.ObjectId | ISupplier;
    @Prop({type : Types.ObjectId , ref : "Warehouse" , required : true , index :true})
    wareHouseId!: Types.ObjectId | IWareHouse;
    @Prop({type : Types.ObjectId , ref : "User" , required : true})
    createdBy!: Types.ObjectId | IUser;
    @Prop({type : Types.ObjectId , ref : "User"})
    updatedBy?: Types.ObjectId | IUser;

    @Prop({type : Number})
    totalCost?: number;

    @Prop({type : String , required : true})
    supplierNameSnapshot!: string;

    @Prop({type : Date})
    expectedAt?: Date ;
    @Prop({type : Date})
    receivedAt?: Date ;
    @Prop({type : Date})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const PurchaseProductsSchema = SchemaFactory.createForClass(PurchaseProducts)
export const PurchaseProductsModel = MongooseModule.forFeatureAsync([
    {
        name : PurchaseProducts.name,
        useFactory :()=>{
            return PurchaseProductsSchema
        }
    }
])