import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWishlistDto, RemoveItemFromWishlistDto } from './dto';
import { Types } from 'mongoose';
import { HUserDocument } from 'src/DB/models';
import { ProductRepository, ProductVariantRepository, WishlistRepository } from 'src/DB/Repository';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { IWishlist } from 'src/common/interface';
import { CacheKeyEnum } from 'src/common/enum';
import { CacheService } from 'src/common/service';

@Injectable()
export class WishlistService {
  constructor(
    private readonly productVariantRepository : ProductVariantRepository,
    private readonly wishlistRepository : WishlistRepository,
    private readonly productRepository : ProductRepository,
    private readonly redis : CacheService,
  ){}

  async create({variantId , productId}: CreateWishlistDto , user : HUserDocument) : Promise<IWishlist> {
    productId = TransformToObjectId(productId as unknown as string) ?? undefined
    variantId = TransformToObjectId(variantId as unknown as string)
    const variantExist = await this.productVariantRepository.findOne({filter : {_id :  variantId, isPublished : true}})
    if (!variantExist) {
      throw new NotFoundException("Product variant not found")
    }
    if (productId) {
      const productExsits = await this.productRepository.findOne({filter : {_id : productId , isPublished : true}})
      if (!productExsits) {
        throw new NotFoundException("Product not found")
      }
    }
    const wishlist = await this.wishlistRepository.findOneAndUpdate({
      filter : {createdBy : user._id} ,
      update : {$addToSet : {items : {variantId , productId }}},
      options : {upsert : true , returnDocument : "after"}
    })
    if(!wishlist) throw new NotFoundException("Failed to update or create wishlist")
    await this.redis.clearCacheKey({key : CacheKeyEnum.WISHLIST ,userId: user._id})
    return wishlist
  }

  async findOne(wishlistId: Types.ObjectId , user : HUserDocument) : Promise<IWishlist> {
    const wishlist = await this.wishlistRepository.findOne({filter : {_id : wishlistId , createdBy : user._id} , options : {populate : [{path : "items.variantId" , select : "sku price images"}]}})
    if(!wishlist) throw new NotFoundException(`Wishlist ${wishlistId.toString()} not found`)
    return wishlist
  }

  async remove(wishlistId: Types.ObjectId , {variantId , productId} : RemoveItemFromWishlistDto , user : HUserDocument):Promise<IWishlist> {
    variantId = TransformToObjectId(variantId as unknown as string) ?? undefined
    productId = TransformToObjectId(productId as unknown as string) ?? undefined
    let wishlist
    if (variantId) {
      wishlist = await this.wishlistRepository.findOneAndUpdate({
        filter : {createdBy : user._id , _id : wishlistId , "items.variantId" :variantId} , 
        update : {$pull : {items : {variantId}}},
      })
      if(!wishlist) throw new NotFoundException(`Fail to remove this item ${variantId.toString()} from wishlist `)
      await this.redis.clearCacheKey({key : CacheKeyEnum.WISHLIST ,userId: user._id})
      return wishlist
    }else if(productId){
      wishlist = await this.wishlistRepository.findOneAndUpdate({
        filter : {createdBy : user._id , _id : wishlistId , "items.productId" :productId} , 
        update : {$pull : {items : {productId}}},
      })
      if(!wishlist) throw new NotFoundException(`Fail to remove this item ${productId.toString()} from wishlist `)
      await this.redis.clearCacheKey({key : CacheKeyEnum.WISHLIST ,userId: user._id})
      return wishlist
    }else{
      throw new BadRequestException('variantId or productId is required');
    }
  }

}
