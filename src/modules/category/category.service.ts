/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { Types } from 'mongoose';
import { HUserDocument } from 'src/DB/models';
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { BrandRepository, CategoryRepository, ProductRepository, ProductVariantRepository } from 'src/DB/Repository';
import { CacheService, S3Service } from 'src/common/service';
import { PaginationDTO } from 'src/common/dto';
import { SortEnum, CategorySortEnum, LogActionEnum, ReferenceModelEnum, CacheKeyEnum } from 'src/common/enum';
import { ICategory, IPagination } from 'src/common/interface';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from 'src/DB/service/database.service';

@Injectable()
export class CategoryService {
  private readonly logger = new Logger(CategoryService.name);
  constructor(
    private readonly categoryRepository : CategoryRepository ,
    private readonly productRepository : ProductRepository ,
    private readonly productVariantRepository : ProductVariantRepository ,
    private readonly brandRepository : BrandRepository ,
    private readonly databaseService : DatabaseService,
    private readonly s3 : S3Service,
    private readonly eventEmitter : EventEmitter2,
    private readonly redis : CacheService,
  ){}
  async createCategory(user : HUserDocument , data: CreateCategoryDto) : Promise<ICategory> {
    const {name  , parentId} = data
    let ancestors : Types.ObjectId[] = []
    if (parentId) {
      const parentCategory = await this.categoryRepository.findOne({filter : {_id : TransformToObjectId(parentId)}})
      if (!parentCategory) {
        throw new NotFoundException("Parent category not found")
      }
      ancestors = [...(parentCategory.ancestors ?? []),parentCategory._id] as Types.ObjectId[]
    }
    const categoryExist = await this.categoryRepository.findOne({filter : {name , paranoid : false}})
    if (categoryExist) {
      throw new ConflictException("This category already exists")
    }
    const category = await this.categoryRepository.create({data : {...data , createdBy : user._id , ancestors , parentId : parentId ? TransformToObjectId(parentId as string) : undefined}})
    if (!category) {
      if (data.image) {
        void this.s3.deleteAsset({Key : data.image}).catch(err => {this.logger.error(err)})
      }
      throw new BadRequestException("Fail to create category");
    }
    await Promise.all([
      this.redis.clearCacheKey({key : CacheKeyEnum.PRODUCTS , isPublic : true}),
      this.redis.clearCacheKey({key : CacheKeyEnum.CATEGORY , isPublic : true}),
      this.redis.clearCacheKey({key : CacheKeyEnum.BRAND , isPublic : true}),
    ])
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.CATEGORY_CREATE,
      referenceId: category._id,
      referenceModel: ReferenceModelEnum.CATEGORY,
      metadata: { name: category.name, isSubCategory: !!parentId }
    });
    this.eventEmitter.emit('category.created', {categoryId: category._id, name: category.name, isSubCategory: !!parentId,actorId: user._id,});
    return category;
  }
  async getAllCategories(query : PaginationDTO) : Promise<IPagination<ICategory>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NAME_ASC , search} = query || {};
    const sortOption = CategorySortEnum[sort] || CategorySortEnum[SortEnum.NEWEST]
    const categories = await this.categoryRepository.paginate({filter : { 
      ...(search ? {$or : [
      {name : new RegExp(search , 'i')},
      {slug : new RegExp(search , 'i')},
      ]} : {})} ,
       limit , page , sort : sortOption , options : {populate : [{path : "ancestors" , select : "name image"}]}})
    if (!categories) {
      throw new NotFoundException("Categories not found")
    }
    return categories;
  }
  async getAllCategoriesArchive(query : PaginationDTO) : Promise<IPagination<ICategory>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NAME_ASC , search} = query || {};
    const sortOption = CategorySortEnum[sort] || CategorySortEnum[SortEnum.NEWEST]
    const categories = await this.categoryRepository.paginate({filter : {
      ...(search ? {$or : [
      {name : new RegExp(search , 'i')},
      {slug : new RegExp(search , 'i')},
      ]}: {}),
       deletedAt : {$exists : true} , paranoid : false
      } 
       , limit , page , sort : sortOption , options : {populate : [{path : "ancestors" , select : "name image"}]}})
    if (!categories.docs.length) {
      throw new NotFoundException("there aren't any Categories in archive")
    }
    return categories;
  }
  async getCategory(categoryId: Types.ObjectId) : Promise<ICategory> {
    const category = await this.categoryRepository.findOne({filter : {_id :categoryId , paranoid : false} , options : {populate : [{path : "createdBy" , select : "firstName lastName"},{path : "updatedBy" , select : "firstName lastName"},{path : "ancestors" , select : "name image"}]}})
    if (!category) {
      throw new NotFoundException("category not found")
    }
    return category
  }
  async updateCategory(user : HUserDocument , categoryId: Types.ObjectId, data: UpdateCategoryDto):Promise<ICategory> {
    let ancestors : Types.ObjectId[] = []
    const {name , image , parentId} = data
    if (parentId && categoryId.toString() === parentId) {
      throw new ConflictException( "You can't set category as its own parent");
    }
    if (parentId) {
      const parentCategory = await this.categoryRepository.findOne({filter : {_id : TransformToObjectId(parentId)}})
      if (!parentCategory) {
        throw new NotFoundException("Parent category not found'")
      }
      if (parentCategory._id.toString() === categoryId.toString() || parentCategory.ancestors?.some(id => id.toString() === categoryId.toString())) {
        throw new ConflictException("You cannot add a category as a subcategory to itself or its descendants")
      }
      ancestors = [...(parentCategory.ancestors ?? []),parentCategory._id] as Types.ObjectId[]
    }
    const existing = await this.categoryRepository.findOne({filter: {name , _id: { $ne: categoryId }}});
    if (existing) {
      throw new ConflictException('Category name already exists');
    }
    const category = await this.categoryRepository.findOneAndUpdate({filter : {_id : categoryId},update : {name , parentId , ancestors , image , updatedBy:  user._id},options:{returnDocument : 'before'}})
    if (!category) {
      throw new NotFoundException("Category not found")
    }
    const oldImage = category.image
    if (image) {
      if (image && oldImage && image !== oldImage) {
        void this.s3.deleteAsset({ Key: oldImage }).catch(err => {this.logger.error(err)});
      }
    }
    await Promise.all([
      this.redis.clearCacheKey({key : CacheKeyEnum.PRODUCTS , isPublic : true}),
      this.redis.clearCacheKey({key : CacheKeyEnum.CATEGORY , isPublic : true}),
      this.redis.clearCacheKey({key : CacheKeyEnum.BRAND , isPublic : true}),
    ])
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.CATEGORY_UPDATE,
      referenceId: categoryId,referenceModel: ReferenceModelEnum.CATEGORY,
      metadata: { 
        oldName: category.name, 
        newName: name || category.name,
        parentChanged: category.parentId?.toString() !== parentId
      }
    });
    this.eventEmitter.emit('category.updated', {
      categoryId: categoryId, name: name || category.name,
      oldName: category.name,parentChanged: category.parentId?.toString() !== parentId,actorId: user._id,
    });
    return category
  }
  async softDelete(categoryId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.databaseService.startSession();
    try {
      session.startTransaction();
      const categories = await this.categoryRepository.find({filter: {
        $or: [{ _id: categoryId }, { parentId: categoryId }, { ancestors: categoryId }],deletedAt: { $exists: false },
        },projection: "name",options: { session },
      });
      if (!categories.length) {
        throw new NotFoundException('Category not found or already deleted');
      }
      const categoryIds = categories.map((c) => c._id);
      const mainCategory = categories.find((c) => c._id.toString() === categoryId.toString()) || categories[0];
      const now = new Date();
      await this.categoryRepository.updateMany({filter: { _id: { $in: categoryIds } },
        update: {$set: { deletedAt: now, updatedBy: user._id },$unset: { restoredAt: 1 }},options: { session },
      });
      const products = await this.productRepository.find({filter: { categoryId: { $in: categoryIds }, deletedAt: { $exists: false } },projection: "_id",options: { session }});
      const productIds = products.map((p) => p._id);
      if (productIds.length > 0) {await this.productVariantRepository.updateMany({
        filter: { productId: { $in: productIds }, deletedAt: { $exists: false } },
        update: {$set: { deletedAt: now, updatedBy: user._id },$unset: { restoredAt: 1 }},options: { session }});
      }
      if (productIds.length > 0) {
        await this.productRepository.updateMany({filter: { _id: { $in: productIds } },
          update: {$set: { deletedAt: now, updatedBy: user._id },$unset: { restoredAt: 1 }},options: { session },
        });
      }
      await this.brandRepository.updateMany({
        filter: { categoryId: { $in: categoryIds }, deletedAt: { $exists: false } },update: {
          $set: { deletedAt: now, updatedBy: user._id },$unset: { restoredAt: 1 },
        },
        options: { session },
      });
      await session.commitTransaction();
      await Promise.all([
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
      ]);
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id, action: LogActionEnum.CATEGORY_REMOVE,
        referenceId: categoryId,referenceModel: ReferenceModelEnum.CATEGORY,
        metadata: { name: mainCategory.name, type: 'SOFT_DELETE_CASCADE', affectedCategoriesCount: categoryIds.length },
      });
      this.eventEmitter.emit('category.soft_deleted', {
        categoryId,productIds,name: mainCategory.name,actorId: user._id,
      });

    return 'Category and all associated data moved to archive successfully';
  } catch (error: any) {
    await session.abortTransaction();
    throw new BadRequestException(error?.message || 'Failed to soft delete category');
  } finally {
    await session.endSession();
  }
  }
  async restoreCategory(categoryId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.databaseService.startSession();
    try {
      session.startTransaction();
      const categories = await this.categoryRepository.find({filter: {$or: [{ _id: categoryId }, { parentId: categoryId }, { ancestors: categoryId }],paranoid: false , deletedAt : {$exists : true}},projection: 'name',options: { session }});
      if (!categories.length) {
        throw new NotFoundException('Category not found or not soft deleted');
      }
      const categoryIds = categories.map((c) => c._id);
      const mainCategory = categories.find((c) => c._id.toString() === categoryId.toString()) || categories[0];
      const now = new Date();
      await this.categoryRepository.updateMany({filter: { _id: { $in: categoryIds } },
        update: {$set: { restoredAt: now, updatedBy: user._id },$unset: { deletedAt: 1 }},options: { session },
      });

      const products = await this.productRepository.find({filter: { categoryId: { $in: categoryIds }, paranoid: false },projection: "_id",options: { session }});
      const productIds = products.map((p) => p._id);
      if (productIds.length > 0) {
        await this.productVariantRepository.updateMany({filter: { productId: { $in: productIds } },
          update: {$set: { restoredAt: now, updatedBy: user._id },$unset: { deletedAt: 1 }},options: { session },
        });
      }
      if (productIds.length > 0) {
        await this.productRepository.updateMany({filter: { _id: { $in: productIds } },update: {$set: { restoredAt: now, updatedBy: user._id },$unset: { deletedAt: 1 }},options: { session }});
      }
      await this.brandRepository.updateMany({filter: { categoryId: { $in: categoryIds } },update: {$set: { restoredAt: now, updatedBy: user._id },$unset: { deletedAt: 1 }},options: { session }});
      await session.commitTransaction();
      await Promise.all([
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
      ]);

      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,
        action: LogActionEnum.CATEGORY_UPDATE,referenceId: categoryId,
        referenceModel: ReferenceModelEnum.CATEGORY,
        metadata: { name: mainCategory.name, actionType: 'RESTORE_CASCADE' },
      });
      this.eventEmitter.emit('category.restored', {categoryId,name: mainCategory.name,actorId: user._id});
      return 'Category and all associated data restored successfully';
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(error?.message || 'Failed to restore category');
    } finally {
      await session.endSession();
    }
  }
  async removeCategory(categoryId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.databaseService.startSession();
    try {
      session.startTransaction();
      const categories = await this.categoryRepository.find({ filter: {$or: [{ _id: categoryId }, { parentId: categoryId }, { ancestors: categoryId }],paranoid: false,force: true},projection: "{ _id name image",options: { session }});
      if (!categories.length) {
        throw new NotFoundException('Category not found');
      }

      const categoryIds = categories.map((c) => c._id);
      const mainCategory = categories.find((c) => c._id.toString() === categoryId.toString()) || categories[0];
      const products = await this.productRepository.find({filter: { categoryId: { $in: categoryIds }, paranoid: false }, projection: "_id",options: { session }});
      const productIds = products.map((p) => p._id);
      if (productIds.length > 0) {
        await this.productVariantRepository.deleteMany({filter: { productId: { $in: productIds }, force: true },options: { session }});
        await this.productRepository.deleteMany({filter: { _id: { $in: productIds }, force: true },options: { session }});
      }
      await this.brandRepository.deleteMany({filter: { categoryId: { $in: categoryIds }, force: true }, options: { session }});
      await this.categoryRepository.deleteMany({filter: { _id: { $in: categoryIds }, force: true }, options: { session }});
      await session.commitTransaction();
      for (const cat of categories) {
        if (cat.image) {
          void this.s3.deleteAsset({ Key: cat.image }).catch((err) => {this.logger.error(`Failed to delete S3 image: ${cat.image}`, err)});
        }
      }
      await Promise.all([
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
      ]);

      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,action: LogActionEnum.CATEGORY_REMOVE,
        referenceId: categoryId,referenceModel: ReferenceModelEnum.CATEGORY,
        metadata: { name: mainCategory.name, type: 'HARD_DELETE_CASCADE' },
      });
      this.eventEmitter.emit('category.deleted', {categoryId,name: mainCategory.name,actorId: user._id});
      return 'Category and all associated data permanently deleted successfully';
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(error?.message || 'Failed to hard delete category');
    } finally {
      await session.endSession();
    }  
  }
}
