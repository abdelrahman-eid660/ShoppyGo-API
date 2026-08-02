import { BrandRepository , CategoryRepository , InventoryRepository , ProductVariantRepository , ProductRepository, ReviewRepository, WishlistRepository, OrderRepository, StockAlertRepository, StockAdjustmentRepository, CartRepository, PurchaseProductsRepository, InventoryMovementRepository, WareHouseTransformRepository } from './../../DB/Repository';
import { BadRequestException, ConflictException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CacheService, S3Service } from 'src/common/service';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { randomUUID } from 'crypto';
import { HUserDocument } from 'src/DB/models';
import { CreateProductVariantDTO, PaginationDTO, UpdateProductVariantDTO } from 'src/common/dto';
import {  CacheKeyEnum, LogActionEnum, ProductVariantSortEnum, ReferenceModelEnum, RoleEnum, SortEnum } from 'src/common/enum';
import { IPagination, IProductVariant } from 'src/common/interface';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from 'src/DB/service/database.service';

@Injectable()
export class ProductVariantService {
  private readonly logger = new Logger(ProductVariantService.name);
  constructor(
    private readonly s3 : S3Service , 
    private readonly productRepository : ProductRepository , 
    private readonly productVariantRepository : ProductVariantRepository, 
    private readonly categoryRepository : CategoryRepository, 
    private readonly reviewRepository: ReviewRepository,
    private readonly wishListRepository: WishlistRepository,
    private readonly orderRepository: OrderRepository,
    private readonly stockAlertRepository: StockAlertRepository,
    private readonly stockAdjustmentRepository: StockAdjustmentRepository,
    private readonly cartRepository: CartRepository,
    private readonly inventoryRepository : InventoryRepository,
    private readonly purchaseRepository : PurchaseProductsRepository,
    private readonly inventoryMovementRepository : InventoryMovementRepository,
    private readonly wareHouseTransformRepository : WareHouseTransformRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly dataBaseService: DatabaseService,
    private readonly brandRepository: BrandRepository,
    private readonly redis: CacheService 
  ){}
  private async cleanUpProducts(images: string[],productVariant: IProductVariant) {
    const removedImages = productVariant.images?.filter(img => !images.includes(img)) ?? [];
    if (!removedImages.length) return;
    await this.s3.deleteAssets({Keys: removedImages.map(Key => ({ Key }))}).catch(err => this.logger.error(err));
  }
  async create({attributes , images , price , productId , sku}: CreateProductVariantDTO , user : HUserDocument):Promise<IProductVariant> {
    const product = await this.productRepository.findOne({filter : {_id : TransformToObjectId(productId as unknown as string)}})
    if (!product) {
      throw new NotFoundException("Product not found")
    }
    let finalSku = sku;
    if (!finalSku) {
      finalSku = `${product.title.toUpperCase()}-${randomUUID().slice(0, 4)}`
    }
    const productVariantExist = await this.productVariantRepository.findOne({filter : {sku : finalSku}})
      if (productVariantExist) {
        throw new ConflictException("This variant already exists with the same SKU please write another SKU or let it.")
    }
    const productVariant = await this.productVariantRepository.create({data : {attributes : attributes ?? [] , images : images ?? [] , price : price ? price : product.basePrice  , productId : TransformToObjectId(productId as unknown as string) , sku : finalSku , createdBy : user._id}})
    if (!productVariant) {
      throw new BadRequestException("Fail to create Variant to this product")
    }
    await Promise.all([
        this.redis.clearCacheKey({key : CacheKeyEnum.GET_PRODUCTS_BY_BRAND , isPublic : true , extra : product.brandId as Types.ObjectId}),
        this.redis.clearCacheKey({key : CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY , isPublic : true , extra : product.categoryId as Types.ObjectId}),
        this.redis.clearCacheKey({key : CacheKeyEnum.PRODUCTS , isPublic : true}),
        this.redis.clearCacheKey({key : CacheKeyEnum.CATEGORY , isPublic : true}),
        this.redis.clearCacheKey({key : CacheKeyEnum.BRAND , isPublic : true}),
        this.redis.clearCacheKey({key : CacheKeyEnum.PRODUCTS_VARIANTS , extra : productVariant._id , isPublic : true})
    ])
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.PRODUCT_VARIANT_CREATE,
      referenceId: productVariant._id,referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
      metadata: { sku: finalSku, price: productVariant.price, productId }
    });
    this.eventEmitter.emit('product-variant.created', {
      variantId: productVariant._id,productId,
      sku: finalSku,price: productVariant.price,actorId: user._id,
    });
    return productVariant
  }
  async findAll(query : PaginationDTO):Promise<IPagination<IProductVariant>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search} = query || {};
    const sortOption = ProductVariantSortEnum[sort] || ProductVariantSortEnum[SortEnum.NEWEST]
      const productVariants = await this.productVariantRepository.paginate({
        filter : {...(search ? {$or : [
        {sku : new RegExp(search , 'i')},
        {slug : new RegExp(search , 'i')},
          ]} : {}), deletedAt : {$exists : false}}
        , page , limit , sort : sortOption
        })
    return productVariants
  }
  async findAllArchive(query : PaginationDTO):Promise<IPagination<IProductVariant>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search} = query || {};
    const sortOption = ProductVariantSortEnum[sort] || ProductVariantSortEnum[SortEnum.NEWEST]
    const productVariants = await this.productVariantRepository.paginate({
        filter : {deletedAt :{$exists :  true} , paranoid : false,
        ...(search ? {$or : [{sku : new RegExp(search , 'i')},{slug : new RegExp(search , 'i')}]} : {})}
        , page , limit , sort : sortOption, 
        })
    return productVariants
  }
  async findOne(variantId: Types.ObjectId , user?  : HUserDocument):Promise<any> {
    if (user && user.role === RoleEnum.USER || !user) {
        const variant= await this.inventoryRepository.findOne({filter : {variantId} , projection : "quantity sold reserved" , options : {populate : [{path : "productVariantId" , select : "image description attributes price slug"}]}})
        return variant 
      }else if(user && [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR].includes(user.role)) {
        const variant = await this.inventoryRepository.findOne({filter : {variantId}  , options : {populate : [{path : "productVariantId",populate : [{path : "productId" , select : "title image"}]} , {path : "createdBy" , select : "firstName lastName email role profileImage gender permissions"}]}})
        return variant
      }
  }
  async update(productVariantId: Types.ObjectId,data: UpdateProductVariantDTO,user: HUserDocument): Promise<IProductVariant> {
    const session = await this.dataBaseService.startSession();
    try {
      session.startTransaction();

      const productVariant = await this.productVariantRepository.findOneAndUpdate({filter: { _id: productVariantId },
        update: { $set: { ...data, updatedBy: user._id } },options: { returnDocument: 'after', session },
      });
      if (!productVariant) {
        throw new NotFoundException('Variant not found');
      }
      if (data.images !== undefined) {
        void this.cleanUpProducts(data.images, productVariant);
      }

      await session.commitTransaction();
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,action: LogActionEnum.PRODUCT_VARIANT_UPDATE,
        referenceId: productVariantId,referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
        metadata: { sku: productVariant.sku, changedFields: Object.keys(data) },
      });
      this.eventEmitter.emit('product-variant.updated', {
        variantId: productVariantId,
        sku: productVariant.sku,
        changedFields: Object.keys(data),
        actorId: user._id,
      });
      await Promise.all([
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: productVariant?.brandId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: productVariant?.categoryId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, extra: productVariant._id, isPublic: true }),
      ]);
      return productVariant;
    } catch (error: any) {
      await session.abortTransaction();
      if (error instanceof HttpException) throw error;
      throw new BadRequestException(error?.message || 'Failed to update variant');
    } finally {
      await session.endSession();
    }
  }
  async publish(variantId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.dataBaseService.startSession();
    try {
      session.startTransaction();
      const variantExists = await this.productVariantRepository.findOne({filter: { _id: variantId, isPublished: false },
        options: { session , returnDocument : "after" },
      });
      if (!variantExists) {
        throw new NotFoundException('Variant not found or already published');
      }
      const [brandExists, categoryExists] = await Promise.all([
        this.brandRepository.findOne({ filter: { _id: variantExists.brandId, isPublished: true }, options: { session } }),
        this.categoryRepository.findOne({ filter: { _id: variantExists.categoryId, isPublished: true }, options: { session } }),
      ]);
      if (!brandExists) throw new BadRequestException('Brand not published or not found');
      if (!categoryExists) throw new BadRequestException('Category not published or not found');
      const variant = await this.productVariantRepository.findOneAndUpdate({filter: { _id: variantId, isPublished: false, stock: { $gt: 0 } },
        update: { $set: { isPublished: true, updatedBy: user._id } }, options: { returnDocument: 'after', session },
      });
      if (!variant) {
        throw new BadRequestException('Cannot publish variant with zero stock or already published');
      }
      await session.commitTransaction();

      await Promise.all([
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: variantExists.brandId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: variantExists.categoryId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, extra: variant._id, isPublic: true }),
      ]);

      this.eventEmitter.emit('audit-log.create', {
      actorId: user._id, action: LogActionEnum.PRODUCT_VARIANT_CONFIRM,
      referenceId: variantId, referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
      metadata: { status: 'PUBLISHED', sku: variant.sku },
      });
      this.eventEmitter.emit('product-variant.published', {variantId, sku: variant.sku, productId: variantExists.productId, actorId: user._id});
      return 'Variant published successfully';
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(error?.message || 'Failed to publish variant');
    } finally {
      await session.endSession();
    }
  }
  async unPublish(variantId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.dataBaseService.startSession();
    try {
      session.startTransaction();
      const variant = await this.productVariantRepository.findOneAndUpdate({filter: { _id: variantId, isPublished: true },
        update: { $set: { isPublished: false, updatedBy: user._id } },
        options: { returnDocument: 'after', session},
      });
      if (!variant) {
        throw new NotFoundException('Variant not found or already unpublished');
      }
      await session.commitTransaction();
      await Promise.all([
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: variant.brandId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: variant.categoryId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, extra: variant._id, isPublic: true }),
      ]);
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,action: LogActionEnum.PRODUCT_VARIANT_CANCEL,
        referenceId: variantId, referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
        metadata: { status: 'UNPUBLISHED', sku: variant.sku },
      });
      this.eventEmitter.emit('product-variant.unpublished', {variantId,sku: variant.sku,productId: variant.productId,actorId: user._id});
      return 'Variant unpublished successfully';
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(error?.message || 'Failed to unpublish variant');
    } finally {
      await session.endSession();
    }
  }
  async softDelete(productVariantId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.dataBaseService.startSession();
    try {
      session.startTransaction();
      const now = new Date();
      const productVariant = await this.productVariantRepository.findOneAndUpdate({filter: { _id: productVariantId, deletedAt: { $exists: false } },
        update: { $set: { deletedAt: now, isPublished: false, updatedBy: user._id }},options: { returnDocument: 'after', session}});
      if (!productVariant) {
        throw new NotFoundException('Variant not found or already soft deleted');
      }
      await this.inventoryRepository.updateMany({filter: { productVariantId: productVariant._id }, update: { $set: { deletedAt: now } }, options: { session },});
      await Promise.all([
        this.cartRepository.updateMany({filter: { 'items.variantId': productVariant._id },update: { $pull: { items: { variantId: productVariant._id } } },options: { session }}),
        this.wishListRepository.updateMany({filter: { 'items.variantId': productVariant._id },update: { $pull: { items: { variantId: productVariant._id } } },options: { session }}),
        this.stockAlertRepository.deleteMany({filter: { productVariantId: productVariant._id },options: { session },}),
      ]);
      await session.commitTransaction();
      await Promise.all([
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: productVariant.brandId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: productVariant.categoryId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, extra: productVariant._id, isPublic: true }),
      ]);
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,action: LogActionEnum.PRODUCT_VARIANT_REMOVE,
        referenceId: productVariantId,referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
        metadata: { type: 'SOFT_DELETE', sku: productVariant.sku },
      });
      this.eventEmitter.emit('product-variant.archived', {variantId: productVariantId,sku: productVariant.sku,actorId: user._id});
      return 'Variant moved to archive successfully';
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(error?.message || 'Failed to soft delete variant');
    } finally {
      await session.endSession();
    }
  }
  async restore(productVariantId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.dataBaseService.startSession();
    try {
      session.startTransaction();
      const now = new Date();
      const productVariant = await this.productVariantRepository.findOneAndUpdate({filter: { _id: productVariantId , deletedAt : {$exists : true}, paranoid: false },
        update: { $set: { restoredAt: now, updatedBy: user._id }},
        options: { returnDocument: 'after', session},
      });
      if (!productVariant) {
        throw new NotFoundException('Variant not found or not soft deleted');
      }
      await this.inventoryRepository.updateMany({filter: { productVariantId: productVariant._id },update: { $unset: { deletedAt: 1 } },options: { session }});
      await session.commitTransaction();
      await Promise.all([
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: productVariant.brandId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: productVariant.categoryId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, extra: productVariant._id, isPublic: true }),
      ]);
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,action: LogActionEnum.PRODUCT_VARIANT_RESTORE,
        referenceId: productVariantId,referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
        metadata: { type: 'RESTORE', sku: productVariant.sku },
      });
      this.eventEmitter.emit('product-variant.restored', {variantId: productVariantId,sku: productVariant.sku,actorId: user._id});
      return 'Variant restored successfully';
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(error?.message || 'Failed to restore variant');
    } finally {
      await session.endSession();
    }
  }
  async remove(productVariantId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.dataBaseService.startSession();
    try {
      session.startTransaction();
      const [hasOrders,hasPurchases,hasInvMoves,hasInventory,hasStockAdjustments,hasWarehouseTransforms,hasReviews] = 
      await Promise.all([
        this.orderRepository.find({ filter: { 'items.variantId': productVariantId } }),
        this.purchaseRepository.find({ filter: { 'items.productVariantId': productVariantId } }),
        this.inventoryMovementRepository.find({ filter: { productVariantId: productVariantId } }),
        this.inventoryRepository.find({ filter: { productVariantId: productVariantId } }),
        this.stockAdjustmentRepository.find({ filter: { 'items.productVariantId': productVariantId } }),
        this.wareHouseTransformRepository.find({ filter: { 'items.productVariantId': productVariantId } }),
        this.reviewRepository.find({ filter: { variantId: productVariantId } }),
      ]);
      if (hasOrders || hasPurchases || hasInvMoves || hasInventory || hasStockAdjustments || hasWarehouseTransforms || hasReviews) {
        throw new BadRequestException('Cannot permanently delete this variant because it has historical transactions (Orders, Purchases, Inventory, Moves, Adjustments, or Reviews). Use soft delete instead.');
      }
      await Promise.all([
        this.cartRepository.updateMany({filter: { 'items.variantId': productVariantId },update: { $pull: { items: { variantId: productVariantId } } },options: { session }}),
        this.wishListRepository.updateMany({filter: { 'items.variantId': productVariantId },update: { $pull: { items: { variantId: productVariantId } } },options: { session }}),
        this.stockAlertRepository.deleteMany({filter: { productVariantId: productVariantId },options: { session }}),
      ]);
      const productVariant = await this.productVariantRepository.findOneAndDelete({filter: { _id: productVariantId, force: true, isDefault: false, paranoid: false },options: { returnDocument: 'before', session, populate: [{ path: 'productId', select: 'categoryId brandId' }] }});
      if (!productVariant) {
        throw new NotFoundException('Variant not found or is default variant');
      }
      await session.commitTransaction();
      if (productVariant.images?.length) {
        void this.s3.deleteAssets({ Keys: productVariant.images.map((Key) => ({ Key })) }).catch((err) => {
          this.logger.error(`Failed to delete variant images for ${productVariant.sku}`, err);
        });
      }
      await Promise.all([
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: productVariant?.brandId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: productVariant?.categoryId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, extra: productVariant._id, isPublic: true }),
      ]);

      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,action: LogActionEnum.PRODUCT_VARIANT_DELETE,
        referenceId: productVariantId,referenceModel: ReferenceModelEnum.PRODUCT_VARIANT,
        metadata: { type: 'FORCE_DELETE', sku: productVariant.sku },
      });
      this.eventEmitter.emit('product-variant.deleted', {variantId: productVariantId,sku: productVariant.sku,actorId: user._id});
      return 'Product variant permanently deleted successfully';
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(error?.message || 'Failed to permanently delete product variant');
    } finally {
      await session.endSession();
    }
  }

}
