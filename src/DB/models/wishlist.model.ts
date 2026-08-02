import { MongooseModule, Prop, raw, Schema, SchemaFactory, Virtual } from "@nestjs/mongoose";
import { HydratedDocument, Types } from "mongoose";
import { IWishlist, IWishlistItem } from "src/common/interface";
export type HWishlistDocument = HydratedDocument<IWishlist>

@Schema({
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    optimisticConcurrency: true,
    strict: true,
    strictQuery: true,
})
export class Wishlist implements Partial<IWishlist>{

    @Prop([
        raw({
            _id : false,
            variantId: { type: Types.ObjectId, required: true, ref: "ProductVariant" },
        }),
    ])
    items!: IWishlistItem[] ;
    @Prop({type : Types.ObjectId , ref : "User" , required : true , unique : true})
    createdBy!: Types.ObjectId ;
    @Virtual({
        get : function(this : HWishlistDocument){
            return this.items.length
        }
    })
    totalItems? : number
    @Prop({type : Date , index : true})
    createdAt!: Date;
    @Prop({type : Date})
    updatedAt!: Date;
}
export const WishlistSchema = SchemaFactory.createForClass(Wishlist)
export const WishlistModel = MongooseModule.forFeature([{name : Wishlist.name , schema : WishlistSchema}])