/* eslint-disable @typescript-eslint/no-base-to-string */
import { ProductVariantRepository , CartRepository, InventoryRepository } from './../../DB/Repository';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateCartDto, RemoveItemDTO, UpdateCartDto } from './dto';
import { HUserDocument } from 'src/DB/models';
import { Types } from 'mongoose';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { ICart, ICartItem } from 'src/common/interface';
import { CacheService } from 'src/common/service';
import { CacheKeyEnum } from 'src/common/enum';

@Injectable()
export class CartService {
  constructor(
    private readonly productVariantRepository : ProductVariantRepository,
    private readonly cartRepository : CartRepository,
    private readonly redis : CacheService,
  ){}
  async create({quantity , variantId}: CreateCartDto , user : HUserDocument):Promise<ICart> {
    const items = []
    quantity = quantity || 1;
    variantId = TransformToObjectId(variantId as unknown as string)
    const productVariant = await this.productVariantRepository.findOne({filter : {_id :  variantId , isPublished : true} , projection : "sku price images stock"})
    if(!productVariant) throw new NotFoundException("Product not found")
    if(quantity > productVariant.stock) throw new BadRequestException("Product out of stock")
    items.push({variantId , quantity , priceSnapshot : productVariant.price , skuSnapshot : productVariant.sku , imageSnapshot : productVariant?.images?.length ? productVariant?.images[0] : ""})
    const cart = await this.cartRepository.findOne({filter : {createdBy: user._id}})
    if (!cart) {
      const newCart = await this.cartRepository.create({data : {createdBy : user._id , items}})
      if (!newCart) throw new BadRequestException("Fail to create cart")
      return newCart
    }
    const variant = cart.items.find(item => variantId.toString() === item.variantId.toString())
    if (!variant) {
      cart.items.push({
        priceSnapshot : productVariant.price,
        variantId,
        quantity,
        skuSnapshot : productVariant.sku,
        imageSnapshot : productVariant?.images?.length ? productVariant.images[0] : "" ,
      })
    }else{
      const newQuantity = variant.quantity + quantity;
      if (newQuantity > productVariant.stock) {
        throw new BadRequestException(`Product ${productVariant.sku} out of stock`);
      }
      variant.quantity = newQuantity;
      variant.priceSnapshot = productVariant.price;
      variant.skuSnapshot = productVariant.sku;
      variant.imageSnapshot = productVariant.images?.[0] ?? "";
    }
    await this.redis.clearCacheKey({key : CacheKeyEnum.CART , userId : user._id})
    return await cart.save()
  }

  async findOne(cartId: Types.ObjectId , user : HUserDocument) {
    const cart = await this.cartRepository.findOne({ filter: { _id: cartId } });
    if (!cart) { 
      throw new NotFoundException("Cart not found");
    }
    if (!cart.items || cart.items.length === 0) {
      return cart;
    }
    const variantIds = cart.items.map(item => item.variantId);
    const variants = await this.productVariantRepository.find({filter: { _id: { $in: variantIds as Types.ObjectId[] } }});
    const variantMap = new Map(variants.map(v => [v._id.toString(), v]));
    let isCartChanged = false;
    const updatedItems: ICartItem[] = [];
    for (const item of cart.items) {
      const currentVariant = variantMap.get(item.variantId.toString());
      if (!currentVariant) {
        isCartChanged = true;
        continue;
      }
      const newPrice = currentVariant.price;
      const newSku = currentVariant.sku;
      const newImage = currentVariant?.images?.length ? currentVariant.images[0] : '';
      if (item.priceSnapshot !== newPrice || item.skuSnapshot !== newSku || item.imageSnapshot !== newImage) {
        isCartChanged = true;
        updatedItems.push({
          ...item,
          priceSnapshot: newPrice,
          skuSnapshot: newSku,
          imageSnapshot: newImage
        });
      } else {
        updatedItems.push(item);
      }
    }
    if (isCartChanged) {
      const newTotalPrice = updatedItems.reduce((acc, item) => acc + (item.priceSnapshot * item.quantity), 0);
      const updatedCart = await this.cartRepository.findOneAndUpdate({filter: { _id: cartId },update: { $set: { items: updatedItems, totalPrice: newTotalPrice } }});
      if (!updatedCart) {
        throw new BadRequestException(`Fail to update items`);
      }
      await this.redis.clearCacheKey({key : CacheKeyEnum.CART , userId : user._id})
      return {
        ...updatedCart.toObject(),
        warningMessage: "Some products were out of stock or removed and have been cleared from your cart."
      };
    }
    return cart;
  }

  async update(cartId: Types.ObjectId, {variantId , quantity}: UpdateCartDto , user : HUserDocument) : Promise<ICart> {
    quantity = quantity ?? 1;
    variantId = TransformToObjectId(variantId as unknown as string)
    const cart = await this.cartRepository.findOne({filter : {_id : cartId , "items.variantId" : variantId}})
    if (!cart) {
      throw new NotFoundException("Cart not exist")
    }
    const variant = await this.productVariantRepository.findOne({filter : {_id :  variantId} , projection : "stock"})
    if(!variant) throw new NotFoundException("Product not found")
    if(quantity > variant.stock) throw new BadRequestException("Product out of stock")
    const newCart = await this.cartRepository.findOneAndUpdate({filter : {_id : cartId , "items.variantId" : variantId},update : {$set : {"items.$.quantity" : quantity}}})
    if (!newCart) {
      throw new NotFoundException("Fail to update cart")
    }
    await this.redis.clearCacheKey({key : CacheKeyEnum.CART , userId : user._id})
    return newCart
  }

  async remove(cartId: Types.ObjectId , {variantId} : RemoveItemDTO , user : HUserDocument): Promise<ICart> {
    variantId = TransformToObjectId(variantId as unknown as string)
    const cart = await this.cartRepository.findOneAndUpdate({filter : {_id : cartId , "items.variantId": variantId,} , update : {$pull : {items : {variantId}}}})
    if (!cart) {
      throw new NotFoundException("Product variant not found")
    }
    await this.redis.clearCacheKey({key : CacheKeyEnum.CART , userId : user._id})
    return cart
  }

  async removeAll(cartId: Types.ObjectId , user : HUserDocument): Promise<string> {
    const cart = await this.cartRepository.findOneAndDelete({filter : {_id : cartId}})
    if (!cart) {
      throw new NotFoundException("Cart is Empty")
    }
    await this.redis.clearCacheKey({key : CacheKeyEnum.CART , userId : user._id})
    return `Cart deleted successfuly`
  }
}
