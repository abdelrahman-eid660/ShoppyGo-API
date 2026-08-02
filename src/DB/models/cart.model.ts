import { MongooseModule, Prop, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { IBrand, ICart, ICartItem, IProductVariant, ISupplier, IUser } from "src/common/interface";

export type HCartDocument = HydratedDocument<ICart>
@Schema({
    _id : false
})
export class CartItem implements Partial<ICartItem>{
    @Prop({type : String , required : true})
    imageSnapshot?: string ;
    @Prop({type : String , required : true})
    skuSnapshot!: string ;
    @Prop({type : Number , required : true})
    quantity!: number ;
    @Prop({type : Number , required : true})
    priceSnapshot!: number;
    @Prop({type : Types.ObjectId , ref : "ProductVariant" , index : true , required : true})
    variantId!: Types.ObjectId;
}
const CartItemSchema = SchemaFactory.createForClass(CartItem)
@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class Cart implements Partial<ICart>{
    @Prop({type : [CartItemSchema] , required : true})
    items!: ICartItem[];

    @Virtual({
        get : function(this : HCartDocument){
            const total = this.items.reduce((acc , current)=>{
                return acc + current.priceSnapshot * current.quantity
            },0)
            return total
        }
    })
    totalPrice?: number;
    @Prop({type : Types.ObjectId , ref : "User" , index : true , required : true})
    createdBy!: Types.ObjectId;
    @Prop({type : Date , index : true})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const CartSchema = SchemaFactory.createForClass(Cart)
export const CartModel = MongooseModule.forFeature([{name : Cart.name , schema : CartSchema}])