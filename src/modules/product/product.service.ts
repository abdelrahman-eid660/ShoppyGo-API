/* eslint-disable @typescript-eslint/no-base-to-string */
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CacheService, S3Service } from 'src/common/service';
import { ProductRepository, CategoryRepository , BrandRepository, ProductVariantRepository, ReviewRepository, WishlistRepository } from 'src/DB/Repository';
import { HUserDocument } from 'src/DB/models';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { IPagination, IProduct, IProductVariant } from 'src/common/interface';
import { PaginationDTO, ProductDto } from 'src/common/dto';
import { CacheKeyEnum, LogActionEnum, ProductSortEnum, ReferenceModelEnum, RoleEnum, SortEnum } from 'src/common/enum';
import { randomUUID } from 'crypto';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from 'src/DB/service/database.service';
import { UpdateProductDto } from './dto';

@Injectable()
export class ProductService {
  private readonly logger = new Logger(ProductService.name);
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly productVariantRepository: ProductVariantRepository,
    private readonly brandRepository: BrandRepository,
    private readonly reviewRepository: ReviewRepository,
    private readonly wishListRepository: WishlistRepository,
    private readonly categoryRepository: CategoryRepository,
    private readonly s3: S3Service,
    private readonly redis: CacheService,
    private readonly eventEmitter: EventEmitter2,
    private readonly databaseService: DatabaseService,
  ) {}
  private async cleanUpProducts(data : ProductDto | UpdateProductDto , product? : IProduct){
    if (product) {
      const oldImage = product?.image || ''
      const oldGallery = product?.gallery || []
      if (data.image) {
        await this.s3.deleteAsset({Key : oldImage}).catch(err => {this.logger.error(err)})
      }
      if (data.gallery?.length) {
        await this.s3.deleteAssets({Keys : oldGallery?.map(Key => ({Key}))}).catch(err => {this.logger.error(err)}) 
      }
    }else{
      if (data?.image) {
        await this.s3.deleteAsset({Key : data.image}).catch(err => {this.logger.error(err)})
      }
      if (data?.gallery?.length) {
        await this.s3.deleteAssets({Keys : data.gallery?.map(Key => ({Key}))}).catch(err => {this.logger.error(err)}) 
      }
    }
  }
  private async invalidateProductCache(params: {
  productId?: Types.ObjectId;
  brandIds?: (Types.ObjectId  | undefined)[];
  categoryIds?: (Types.ObjectId  | undefined)[];
  variantIds?: (Types.ObjectId )[];
}) {
  const promises: Promise<any>[] = [
    this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
    this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
    this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
  ];
  if (params.productId) {
    promises.push(
      this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true, extra: params?.productId })
    );
  }
  params.brandIds?.filter(Boolean).forEach((bId : any) => {
    promises.push(
      this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: bId })
    );
  });
  params.categoryIds?.filter(Boolean).forEach((cId : any) => {
    promises.push(
      this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: cId })
    );
  });
  params.variantIds?.filter(Boolean).forEach((vId) => {
    promises.push(
      this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, isPublic: true, extra: vId })
    );
  });
  await Promise.all(promises);
  }
  async create(data: ProductDto, user: HUserDocument) : Promise<IProduct> {
    const session = await this.databaseService.startSession()
    try {
      session.startTransaction()
      const [brand, category] = await Promise.all([
        this.brandRepository.findOne({ filter: { _id: data.brandId } , options :{session} }),
        this.categoryRepository.findOne({ filter: { _id: data.categoryId },options:{session} }),
      ]);
      if (!brand) throw new NotFoundException("Brand not found");
      if (!category) throw new NotFoundException("Category not found");
      const productExist = await this.productRepository.findOne({ filter: {title : data.title , brandId : data.brandId , categoryId : data.categoryId , paranoid : false},options:{session}});
      if (productExist) throw new ConflictException("Product already exists")
      const product = await this.productRepository.createOne({data : {...data, brandId : data.brandId , categoryId : data.categoryId , createdBy : user._id},options:{session , ordered:true}})
      if (!product) {
        void this.cleanUpProducts(data)
        throw new BadRequestException("Fail to crate this product")
      }
      const sku = `${product.title.toUpperCase()}-${randomUUID().slice(0, 4)}`
      const productVariant = await this.productVariantRepository.createOne({data : {productId : product._id , categoryId : product.categoryId , brandId : product.brandId , images : [...product.gallery , product.image] , attributes : product.attributes , createdBy : user._id , description : product.description , price : product.basePrice , sku , isDefualt : true },options:{session}})
      if (!productVariant) {
        throw new BadRequestException(`Fail to create variant from this product ${product.title}`)
      }
      await session.commitTransaction()
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,referenceId: product._id,
        action: LogActionEnum.PRODUCT_CREATE,referenceModel: ReferenceModelEnum.PRODUCT,
        metadata: { 
          title: product.title, brandId: data.brandId, 
          categoryId: data.categoryId,defaultVariantId: productVariant._id,defaultSku: sku
        }
      });
      this.eventEmitter.emit('product.created', {
        productId: product._id, title: product.title,
        defaultSku: productVariant.sku,brandId: data.brandId,
        categoryId: data.categoryId,actorId: user._id,
      });
      await Promise.all([
        this.redis.clearCacheKey({key : CacheKeyEnum.GET_PRODUCTS_BY_BRAND , isPublic : true , extra : data.brandId}),
        this.redis.clearCacheKey({key : CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY , isPublic : true , extra : data.categoryId}),
        this.redis.clearCacheKey({key : CacheKeyEnum.PRODUCTS , isPublic : true}),
        this.redis.clearCacheKey({key : CacheKeyEnum.PRODUCTS_VARIANTS , extra : productVariant._id , isPublic : true}),
        this.redis.clearCacheKey({key : CacheKeyEnum.CATEGORY , isPublic : true}),
        this.redis.clearCacheKey({key : CacheKeyEnum.BRAND , isPublic : true})
      ])
      return  product;
    } catch (error) {
      await session.abortTransaction()
      throw new BadRequestException(error)
    } finally {
      await session.endSession()
    }
  }
  async update(productId: Types.ObjectId, data: UpdateProductDto, user: HUserDocument): Promise<IProduct> {
    const session = await this.databaseService.startSession();
    try {
      session.startTransaction();
      const existingProduct = await this.productRepository.findOne({
        filter: { _id: productId },
        options: { session }
      });
      if (!existingProduct) throw new NotFoundException("Product not found");
      const oldBrandId = existingProduct.brandId;
      const oldCategoryId = existingProduct.categoryId;
      if (data.title && data.title !== existingProduct.title) {
          const productExist = await this.productRepository.findOne({
            filter: { title: data.title, _id: { $ne: productId } },
            options: { session }
          });
        if (productExist) throw new ConflictException("This Product's title already exists");
      }
      if (data.brandId && data.brandId.toString() !== oldBrandId.toString()) {
        const brand = await this.brandRepository.findOne({ filter: { _id: data.brandId }, options: { session } });
        if (!brand) throw new NotFoundException("New Brand not found");
      }
      if (data.categoryId && data.categoryId.toString() !== oldCategoryId.toString()) {
        const category = await this.categoryRepository.findOne({ filter: { _id: data.categoryId }, options: { session } });
        if (!category) throw new NotFoundException("New Category not found");
      }
      const updatedProduct = await this.productRepository.findOneAndUpdate({
        filter: { _id: productId },
        update: { $set: { ...data, updatedBy: user._id } },
        options: { returnDocument: "after", session }
      });
      if (!updatedProduct) throw new NotFoundException("Product not found");
      const variantUpdateData: Record<string, any> = {};
      if (data.basePrice !== undefined) variantUpdateData.price = data.basePrice;
      if (data.attributes !== undefined) variantUpdateData.attributes = data.attributes;
      if (data.description !== undefined) variantUpdateData.description = data.description;
      if (data.brandId !== undefined) variantUpdateData.brandId = data.brandId;
      if (data.categoryId !== undefined) variantUpdateData.categoryId = data.categoryId;
      if (data.gallery !== undefined || data.image !== undefined) {
        const finalGallery = data.gallery ?? updatedProduct.gallery;
        const finalImage = data.image ?? updatedProduct.image;
        variantUpdateData.images = [...finalGallery, finalImage];
      }
      const updatedVariant = await this.productVariantRepository.findOneAndUpdate({
        filter: { productId: updatedProduct._id, isDefualt: true },
        update: { $set: variantUpdateData },
        options: { session, returnDocument: "after" }
      });
      if (data.brandId || data.categoryId) {
        await this.productVariantRepository.updateMany({filter: { productId },
          update: {$set: {...(data.brandId && { brandId: data.brandId }),...(data.categoryId && { categoryId: data.categoryId })}},
          options: { session }
        });
      }
      await session.commitTransaction();
      await this.invalidateProductCache({
      productId: updatedProduct._id,
      brandIds: [oldBrandId as Types.ObjectId, data.brandId],
      categoryIds: [oldCategoryId as Types.ObjectId, data.categoryId],
      variantIds: updatedVariant ? [updatedVariant._id] : []
      });
      void this.cleanUpProducts(data, existingProduct);
      this.eventEmitter.emit('audit-log.create', {
      actorId: user._id, action: LogActionEnum.PRODUCT_UPDATE,
      referenceId: productId, referenceModel: ReferenceModelEnum.PRODUCT,
      metadata: { title: updatedProduct.title, changedFields: Object.keys(data), syncedDefaultVariant: true }
      });
      this.eventEmitter.emit('product.updated', {
      productId: updatedProduct._id, title: updatedProduct.title,
      changedFields: Object.keys(data), actorId: user._id,
      });
      return updatedProduct;
    } catch (error) {
        await session.abortTransaction();
        throw new BadRequestException(error);
    } finally {
        await session.endSession();
    }
  }
  async findAll(query : PaginationDTO , user? : HUserDocument):Promise<IPagination<IProduct>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search} = query || {};
    const sortOption = ProductSortEnum[sort] || ProductSortEnum[SortEnum.NEWEST]
    if (user && user.role === RoleEnum.USER || !user) {
      const products = await this.productRepository.paginate({
        filter : {
          ...(search ? {$or : [
          {title : new RegExp(search , 'i')},
          {slug : new RegExp(search , 'i')},
      ]} : {})}
      , page , limit , sort : sortOption , projection : "description title rating basePrice image attributes slug"
    })
      return products
    }else if(user && [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR].includes(user.role)){
      const products = await this.productRepository.paginate({
        filter : {...(search ? {$or : [
        {title : new RegExp(search , 'i')},
        {slug : new RegExp(search , 'i')},
          ]} : {}), deletedAt : {$exists : false}}
        , page , limit , sort : sortOption , projection : "description title rating basePrice image createdAt attributes attributes slug", 
        options : {populate : [ {path : "brandId" , select : "name slug"} , 
        {path : "categoryId" , select : "name ancestors slug" , populate : {path : "ancestors" , select : "name slug"}}]}
        })
        return products
      }else{
        throw new BadRequestException(`Bad requset`)
      }
  }
  async findAllArchive(query : PaginationDTO):Promise<IPagination<IProduct>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search} = query || {};
    const sortOption = ProductSortEnum[sort] || ProductSortEnum[SortEnum.NEWEST]
    const products = await this.productRepository.paginate({
        filter : {deletedAt :{$exists :  true} , paranoid : false,
        ...(search ? {$or : [
        {title : new RegExp(search , 'i')},
        {slug : new RegExp(search , 'i')},
          ]} : {})}
        , page , limit , sort : sortOption , projection : "description title rating basePrice image createdAt slug ", 
        options : {populate : [ {path : "brandId" , select : "name slug "} , 
        {path : "categoryId" , select : "name slug ancestors" , populate : {path : "ancestors" , select : "name slug"}}]}
        })
        if (!products.docs.length) {
          throw new NotFoundException(`There aren't products`)
        }
        return products
  }
  async findOne(productId: Types.ObjectId , user  : HUserDocument):Promise<{variants : IProductVariant[] , product : IProduct}> {
    if (user.role === RoleEnum.USER) {
      const [variants , product] = await Promise.all([
        this.productVariantRepository.find({filter : {productId} , projection : "images attributes price"}),
        this.productRepository.findOne({filter : {_id : productId} ,
         projection : "-createdBy -updatedBy -updatedAt -restoredAt - deletedAt",
          options : {populate : [ 
            {path : "brandId" , select : "name image"}, 
            {path : "categoryId" , select : "name image ancestors" , populate : {path : "ancestors" , select : "name image"}}
          ]}
        })
      ])
      if (!product) {
        throw new NotFoundException("Product not found")
      }
      return {variants , product}
    }else {
      const [variants , product] = await Promise.all([
       this.productVariantRepository.find({filter : {productId}}),
       this.productRepository.findOne({filter : {_id : productId}, 
          options : {populate : [ 
            {path : "createdBy" , select : "firstName lastName role"},
            {path : "updatedBy" , select : "firstName lastName role"},
            {path : "brandId" , select : "name image"}, 
            {path : "categoryId" , select : "name image ancestors" , populate : {path : "ancestors" , select : "name image"}}
          ]}
        })
      ])
      if (!product) {
        throw new NotFoundException("Product not found")
      }
      return {variants , product}
    }
  }
  async getProductsByCategory(categoryId: Types.ObjectId , user  : HUserDocument):Promise<IProduct[]> {
    if (user.role === RoleEnum.USER) {
      const products = await this.productRepository.find({filter : {categoryId}, 
        options : {populate : [ 
          {path : "brandId" , select : "name image"}, 
          {path : "categoryId" , select : "name image ancestors" , populate : {path : "ancestors" , select : "name image"}}
        ]}
      })
      if (!products.length) {
        throw new NotFoundException("Product not found")
      }
      return products
    }else {
      const products = await this.productRepository.find({filter : {categoryId}, 
        options : {populate : [ 
          {path : "createdBy" , select : "firstName lastName role"},
          {path : "updatedBy" , select : "firstName lastName role"},
          {path : "brandId" , select : "name image"}, 
          {path : "categoryId" , select : "name image ancestors" , populate : {path : "ancestors" , select : "name image"}}
        ]}
      })
      if (!products.length) {
        throw new NotFoundException("Product not found")
      }
      return products
    }
  }
  async getProductsByBrand(brandId: Types.ObjectId , user  : HUserDocument):Promise<IProduct[]> {
    if (user.role === RoleEnum.USER) {
      const products = await this.productRepository.find({filter : {brandId} ,
       projection : "-createdBy -updatedBy -updatedAt -restoredAt - deletedAt"})
      if (!products.length) {
        throw new NotFoundException("Product not found")
      }
      return products
    }else {
      const products = await this.productRepository.find({filter : {brandId}, 
        options : {populate : [ 
          {path : "createdBy" , select : "firstName lastName role"},
          {path : "updatedBy" , select : "firstName lastName role"},
          {path : "brandId" , select : "name image"}, 
          {path : "categoryId" , select : "name image ancestors" , populate : {path : "ancestors" , select : "name image"}}
        ]}
      })
      if (!products.length) {
        throw new NotFoundException("Product not found")
      }
      return products
    }
  }
  async publish(productId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.databaseService.startSession();
    try {
      session.startTransaction();
      const product = await this.productRepository.findOneAndUpdate({filter: { _id: productId, isPublished: false },update: { isPublished: true, updatedBy: user._id },options: { returnDocument: 'after', session }});
      if (!product) {
        throw new NotFoundException('Product not found or already published');
      }
      await this.productVariantRepository.updateMany({filter: { productId: product._id },update: { isPublished: true, updatedBy: user._id },options: { session },});
      const variants = await this.productVariantRepository.find({filter: { productId: product._id },options: { session }});
      await session.commitTransaction();
      const variantCacheClears = variants.map((v) =>this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, extra: v._id, isPublic: true }));
      await Promise.all([...variantCacheClears,
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: product.brandId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: product.categoryId as Types.ObjectId }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
      ]);
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,action: LogActionEnum.PRODUCT_CONFIRM,
        referenceId: productId,referenceModel: ReferenceModelEnum.PRODUCT,
        metadata: { title: product.title, status: 'PUBLISHED' },
      });
      this.eventEmitter.emit('product.published', { productId: product._id, title: product.title, actorId: user._id });
      return 'Product published successfully';
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(error?.message || 'Failed to publish product');
    } finally {
      await session.endSession();
    }
  }
  async unPublish(productId: Types.ObjectId, user: HUserDocument): Promise<string> {
  const session = await this.databaseService.startSession();
  try {
    session.startTransaction();

    const product = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId, isPublished: true },
      update: { isPublished: false, updatedBy: user._id },
      options: { returnDocument: 'after', session },
    });

    if (!product) {
      throw new NotFoundException('Product not found or already unpublished');
    }

    await this.productVariantRepository.updateMany({
      filter: { productId: product._id },
      update: { isPublished: false, updatedBy: user._id },
      options: { session },
    });

    const variants = await this.productVariantRepository.find({
      filter: { productId: product._id },
      options: { session },
    });

    await session.commitTransaction();

    const variantCacheClears = variants.map((v) =>
      this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, extra: v._id, isPublic: true })
    );

    await Promise.all([
      ...variantCacheClears,
      this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: product.brandId as Types.ObjectId }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: product.categoryId as Types.ObjectId }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
    ]);

    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.PRODUCT_CANCEL,
      referenceId: productId,
      referenceModel: ReferenceModelEnum.PRODUCT,
      metadata: { title: product.title, status: 'UNPUBLISHED' },
    });

    this.eventEmitter.emit('product.unpublished', { productId: product._id, title: product.title, actorId: user._id });

    return 'Product unpublished successfully';
  } catch (error: any) {
    await session.abortTransaction();
    throw new BadRequestException(error?.message || 'Failed to unpublish product');
  } finally {
    await session.endSession();
  }
  }
  async softDelete(productId: Types.ObjectId, user: HUserDocument): Promise<string> {
  const session = await this.databaseService.startSession();
  try {
    session.startTransaction();

    const now = new Date();

    const product = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId, deletedAt: { $exists: false } },
      update: {
        $set: { deletedAt: now, updatedBy: user._id },
        $unset: { restoredAt: 1 },
      },
      options: { returnDocument: 'after', session },
    });

    if (!product) {
      throw new NotFoundException('Product not found or already soft deleted');
    }

    await this.productVariantRepository.updateMany({
      filter: { productId: product._id },
      update: {
        $set: { deletedAt: now, updatedBy: user._id },
        $unset: { restoredAt: 1 },
      },
      options: { session },
    });

    await this.reviewRepository.updateMany({
      filter: { productId: product._id },
      update: {
        $set: { deletedAt: now, updatedBy: user._id },
        $unset: { restoredAt: 1 },
      },
      options: { session },
    });

    await this.wishListRepository.updateMany({
      filter: { 'items.productId': product._id },
      update: { $pull: { items: { productId: product._id } } },
      options: { session },
    });

    const variants = await this.productVariantRepository.find({
      filter: { productId: product._id, paranoid: false },
      options: { session },
    });

    await session.commitTransaction();
    const variantCacheClears = variants.map((v) =>
      this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, extra: v._id, isPublic: true })
    );

    await Promise.all([
      ...variantCacheClears,
      this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: product.brandId as Types.ObjectId }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: product.categoryId as Types.ObjectId }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
    ]);

    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.PRODUCT_REMOVE,
      referenceId: productId,
      referenceModel: ReferenceModelEnum.PRODUCT,
      metadata: { type: 'SOFT_DELETE', title: product.title },
    });

    this.eventEmitter.emit('product.archived', { productId: product._id, title: product.title, actorId: user._id });

    return 'Product moved to archive successfully';
  } catch (error: any) {
    await session.abortTransaction();
    throw new BadRequestException(error?.message || 'Failed to soft delete product');
  } finally {
    await session.endSession();
  }
  }
  async restore(productId: Types.ObjectId, user: HUserDocument): Promise<string> {
  const session = await this.databaseService.startSession();
  try {
    session.startTransaction();

    const now = new Date();

    const product = await this.productRepository.findOneAndUpdate({
      filter: { _id: productId, paranoid: false },
      update: {
        $set: { restoredAt: now, updatedBy: user._id },
        $unset: { deletedAt: 1 },
      },
      options: { returnDocument: 'after', session },
    });

    if (!product) {
      throw new NotFoundException('Product not found or not soft deleted');
    }

    await this.productVariantRepository.updateMany({
      filter: { productId: product._id },
      update: {
        $set: { restoredAt: now, updatedBy: user._id },
        $unset: { deletedAt: 1 },
      },
      options: { session },
    });

    await this.reviewRepository.updateMany({
      filter: { productId: product._id },
      update: {
        $set: { restoredAt: now, updatedBy: user._id },
        $unset: { deletedAt: 1 },
      },
      options: { session },
    });

    const variants = await this.productVariantRepository.find({
      filter: { productId: product._id, paranoid: false },
      options: { session },
    });

    await session.commitTransaction();
    await session.commitTransaction();

    const variantCacheClears = variants.map((v) =>
      this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS_VARIANTS, extra: v._id, isPublic: true })
    );

    await Promise.all([
      ...variantCacheClears,
      this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_BRAND, isPublic: true, extra: product.brandId as Types.ObjectId }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY, isPublic: true, extra: product.categoryId as Types.ObjectId }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
    ]);

    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.PRODUCT_RESTORE,
      referenceId: productId,
      referenceModel: ReferenceModelEnum.PRODUCT,
      metadata: { type: 'RESTORE', title: product.title },
    });

    this.eventEmitter.emit('product.restored', { productId: product._id, title: product.title, actorId: user._id });

    return 'Product restored successfully';
  } catch (error: any) {
    await session.abortTransaction();
    throw new BadRequestException(error?.message || 'Failed to restore product');
  } finally {
    await session.endSession();
  }
  }
  async remove(productId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.databaseService.startSession();
    try {
      session.startTransaction();
      const variants = await this.productVariantRepository.find({filter: { productId, paranoid: false },options: { session }});
      const product = await this.productRepository.findOneAndDelete({filter: { _id: productId, force: true, paranoid: false },options: { returnDocument: 'before', session }});
      if (!product) {
        throw new NotFoundException('Product not found');
      }
      const variantDeleteResult = await this.productVariantRepository.deleteMany({filter: { productId: product._id, force: true },options: { session }});
      await this.reviewRepository.deleteMany({filter: { productId: product._id, force: true },options: { session }});
      await this.wishListRepository.updateMany({filter: { 'items.productId': product._id },update: { $pull: { items: { productId: product._id } } },options: { session }});
      await session.commitTransaction();
      if (product.image) {
        void this.s3.deleteAsset({ Key: product.image }).catch((err) => {this.logger.error(`Failed to delete product image: ${product.image}`, err)});
      }
      if (product.gallery && product.gallery.length > 0) {
        void this.s3.deleteAssets({ Keys: product.gallery.map((Key) => ({ Key })) }).catch((err) => {this.logger.error(`Failed to delete product gallery`, err)});
      }
      await this.invalidateProductCache({productId,brandIds: [product.brandId as Types.ObjectId],categoryIds: [product.categoryId as Types.ObjectId],variantIds: variants.map((v) => v._id)});
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,action: LogActionEnum.PRODUCT_DELETE,
        referenceId: productId, referenceModel: ReferenceModelEnum.PRODUCT,
         metadata: { type: 'FORCE_DELETE', title: product.title, variantsDeleted: variantDeleteResult.deletedCount },
      });
      this.eventEmitter.emit('product.deleted', {productId: productId,title: product.title,variantsDeleted: variantDeleteResult.deletedCount,actorId: user._id});
      return 'Product permanently deleted successfully';
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(error?.message || 'Failed to permanently delete product');
    } finally {
      await session.endSession();
    }
  }
}
