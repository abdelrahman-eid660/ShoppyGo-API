import { IsMongoId, IsNotEmpty, IsOptional } from "class-validator";
import { Types } from "mongoose";
import { AtLeastOneRequired } from "src/common/decorator";
import { IWishlistItem } from "src/common/interface";
export class CreateWishlistDto implements Partial <IWishlistItem> {
    @IsMongoId()
    @IsNotEmpty()
    variantId!: Types.ObjectId;
    @IsMongoId()
    @IsOptional()
    productId?: Types.ObjectId;
}
export class RemoveItemFromWishlistDto implements Partial <IWishlistItem> {
    @IsMongoId()
    @IsOptional() 
    @AtLeastOneRequired('productId')
    variantId?: Types.ObjectId;
    @IsMongoId()
    @IsOptional()
    @AtLeastOneRequired('variantId')
    productId?: Types.ObjectId;
}
