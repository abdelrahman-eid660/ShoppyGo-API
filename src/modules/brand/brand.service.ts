import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { BrandDto } from './dto/create-brand.dto';
import { BrandRepository, ProductRepository, ProductVariantRepository } from 'src/DB/Repository';
import { HUserDocument } from 'src/DB/models';
import {  IBrand, IPagination } from 'src/common/interface';
import { BrandSortEnum, CacheKeyEnum, LogActionEnum, ReferenceModelEnum, SortEnum } from 'src/common/enum';
import { CacheService, S3Service } from 'src/common/service';
import { PaginationDTO } from 'src/common/dto';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { DatabaseService } from 'src/DB/service/database.service';

@Injectable()
export class BrandService {
  private readonly logger = new Logger(BrandService.name);
  constructor(
    private readonly productRepository : ProductRepository ,
    private readonly productVariantRepository : ProductVariantRepository ,
    private readonly brandRepository : BrandRepository ,
    private readonly dataBaseService : DatabaseService,
    private readonly s3 : S3Service,
    private readonly eventEmitter: EventEmitter2,
    private readonly redis: CacheService,
    ){}
  async createBrand({logo , name}: BrandDto , user : HUserDocument) : Promise<IBrand> {
    const brandExist = await this.brandRepository.findOne({filter : {name , paranoid : false}})
    if (brandExist) {
      throw new ConflictException("This Brand already exists")
    }
    const brand = await this.brandRepository.create({data : {logo , name , createdBy : user._id }})
    if (!brand) {
      if(logo) void this.s3.deleteAsset({Key : logo}).catch(err => {this.logger.error(err)})
      throw new BadRequestException("Fail to create brand")
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.BRAND_CREATE,referenceId: brand._id,
      referenceModel: ReferenceModelEnum.BRAND,metadata: { name: brand.name }
    });
    this.eventEmitter.emit('brand.created', {brandId: brand._id, name: brand.name,actorId: user._id});
    await Promise.all([
      this.redis.clearCacheKey({key : CacheKeyEnum.PRODUCTS , isPublic : true}),
      this.redis.clearCacheKey({key : CacheKeyEnum.CATEGORY , isPublic : true}),
      this.redis.clearCacheKey({key : CacheKeyEnum.BRAND , isPublic : true}),
    ])
    return brand
  }
  async updateBrand({logo , name}: BrandDto , user : HUserDocument , brandId : Types.ObjectId) : Promise<IBrand> {
    const existing = await this.brandRepository.findOne({filter: {name , _id: { $ne: brandId } , paranoid : false}});
    if (existing) {
      throw new ConflictException('Brand name already exists');
    }
    const brand = await this.brandRepository.findOneAndUpdate({filter : {_id : brandId},update : {name , logo , updatedBy:  user._id},options:{returnDocument : 'before'}})
    if (!brand) {
      throw new NotFoundException("Brand not found")
    }
    const oldLogo = brand.logo
    if (logo) {
      if (logo && oldLogo && logo !== oldLogo) {
        void this.s3.deleteAsset({ Key: oldLogo }).catch(err => {this.logger.error(err);});
      }
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.BRAND_UPDATE,
      referenceId: brand._id,referenceModel: ReferenceModelEnum.BRAND,
      metadata: { 
        oldName: brand.name, 
        newName: name || brand.name,
        logoChanged: logo !== undefined && logo !== oldLogo
      }
    });
    this.eventEmitter.emit('brand.updated', {
      brandId: brand._id, name: name || brand.name,oldName: brand.name,
      actorId: user._id,logoChanged: logo !== undefined && logo !== oldLogo,
    });
    await Promise.all([
      this.redis.clearCacheKey({key : CacheKeyEnum.PRODUCTS , isPublic : true}),
      this.redis.clearCacheKey({key : CacheKeyEnum.CATEGORY , isPublic : true}),
      this.redis.clearCacheKey({key : CacheKeyEnum.BRAND , isPublic : true}),
    ])
    return brand
  }
  async allBrands(query:PaginationDTO) : Promise<IPagination<IBrand>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NAME_ASC , search} = query || {};
    const sortOption = BrandSortEnum[sort] || BrandSortEnum[SortEnum.NEWEST]
    const brands = await this.brandRepository.paginate({filter : {
      ...(search ? {$or : [
      {name : new RegExp(search , 'i')},
      {slug : new RegExp(search , 'i')},
      ]} : {}),
    } , 
      limit , page , sort : sortOption})
    if (!brands.docs.length) {
      throw new NotFoundException("there aren't any brands in archive")
    }
    return brands;
  }
  async AllBrandsArchive(query : PaginationDTO) : Promise<IPagination<IBrand>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NAME_ASC , search} = query || {};
    const sortOption = BrandSortEnum[sort] || BrandSortEnum[SortEnum.NEWEST]
    const brands = await this.brandRepository.paginate({filter : {
      ...(search ? {$or : [
      {name : new RegExp(search , 'i')},
      {slug : new RegExp(search , 'i')},
      ]} : {}),
      deletedAt : {$exists : true} , paranoid : false
    } , 
      limit , page , sort : sortOption})
    if (!brands.docs.length) {
      throw new NotFoundException("there aren't any brands in archive")
    }
    return brands;
  }
  async getBrand(brandId: Types.ObjectId):Promise<IBrand> {
    const brand = await this.brandRepository.findOne({filter : {_id :brandId , paranoid : false} , options : {populate : [{path : "createdBy" , select : "firstName lastName"},{path : "updatedBy" , select : "firstName lastName"}]}})
    if (!brand) {
      throw new NotFoundException("Brand not found")
    }
    return brand
  }
  async softDelete(brandId: Types.ObjectId, user: HUserDocument): Promise<string> {
    const session = await this.dataBaseService.startSession();
    try {
      session.startTransaction();
      const now = new Date();

      const brand = await this.brandRepository.findOneAndUpdate({filter: { _id: brandId, deletedAt: { $exists: false } },
        update: {$set: { deletedAt: now, updatedBy: user._id },$unset: { restoredAt: 1 },},
        options: { returnDocument: 'after', session },
      });
      if (!brand) {
        throw new NotFoundException('Brand not found or already deleted');
      }

      const products = await this.productRepository.find({filter: { brandId, deletedAt: { $exists: false } },projection: { _id: 1 },options: { session }});
      const productIds = products.map((p) => p._id);
      if (productIds.length > 0) {
        await this.productVariantRepository.updateMany({filter: { productId: { $in: productIds }, deletedAt: { $exists: false } },
          update: {$set: { deletedAt: now, updatedBy: user._id },$unset: { restoredAt: 1 }},options: { session }});
        await this.productRepository.updateMany({filter: { _id: { $in: productIds } },
          update: {$set: { deletedAt: now, updatedBy: user._id },$unset: { restoredAt: 1 }},options: { session }});
      }
      await session.commitTransaction();
      await Promise.all([
        this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
        this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
      ]);
      this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.BRAND_REMOVE,
      referenceId: brand._id,
      referenceModel: ReferenceModelEnum.BRAND,
      metadata: { name: brand.name, type: 'SOFT_DELETE_CASCADE', affectedProductsCount: productIds.length },
    });

    this.eventEmitter.emit('brand.soft_deleted', {
      brandId: brand._id,
      productIds,
      name: brand.name,
      actorId: user._id,
    });

    return 'Brand and all associated products moved to archive successfully';
  } catch (error: any) {
    await session.abortTransaction();
    throw new BadRequestException(error?.message || 'Failed to soft delete brand');
  } finally {
    await session.endSession();
  }
  }
  async restore(brandId: Types.ObjectId, user: HUserDocument): Promise<string> {
  const session = await this.dataBaseService.startSession();
  try {
    session.startTransaction();

    const now = new Date();

    const brand = await this.brandRepository.findOneAndUpdate({
      filter: { _id: brandId , deletedAt : {$exists : true}, paranoid: false },
      update: {
        $set: { restoredAt: now, updatedBy: user._id },
        $unset: { deletedAt: 1 },
      },
      options: { returnDocument: 'after', session },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found or not soft deleted');
    }

    const products = await this.productRepository.find({
      filter: { brandId, paranoid: false },
      projection: { _id: 1 },
      options: { session },
    });
    const productIds = products.map((p) => p._id);

    if (productIds.length > 0) {
      await this.productVariantRepository.updateMany({
        filter: { productId: { $in: productIds } },
        update: {
          $set: { restoredAt: now, updatedBy: user._id },
          $unset: { deletedAt: 1 },
        },
        options: { session },
      });

      await this.productRepository.updateMany({
        filter: { _id: { $in: productIds } },
        update: {
          $set: { restoredAt: now, updatedBy: user._id },
          $unset: { deletedAt: 1 },
        },
        options: { session },
      });
    }

    await session.commitTransaction();

    await Promise.all([
      this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
    ]);

    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.BRAND_UPDATE,
      referenceId: brand._id,
      referenceModel: ReferenceModelEnum.BRAND,
      metadata: { name: brand.name, actionType: 'RESTORE_CASCADE' },
    });

    this.eventEmitter.emit('brand.restored', {
      brandId: brand._id,
      productIds,
      name: brand.name,
      actorId: user._id,
    });

    return 'Brand and all associated products restored successfully';
  } catch (error: any) {
    await session.abortTransaction();
    throw new BadRequestException(error?.message || 'Failed to restore brand');
  } finally {
    await session.endSession();
  }
  }
  async removeBrand(brandId: Types.ObjectId, user: HUserDocument): Promise<string> {
  const session = await this.dataBaseService.startSession();
  try {
    session.startTransaction();

    const brand = await this.brandRepository.findOneAndDelete({
      filter: { _id: brandId, paranoid: false, force: true },
      options: { returnDocument: 'before', session },
    });

    if (!brand) {
      throw new NotFoundException('Brand not found');
    }

    const products = await this.productRepository.find({
      filter: { brandId, paranoid: false },
      projection: { _id: 1 },
      options: { session },
    });
    const productIds = products.map((p) => p._id);

    if (productIds.length > 0) {
      await this.productVariantRepository.deleteMany({
        filter: { productId: { $in: productIds }, force: true },
        options: { session },
      });

      await this.productRepository.deleteMany({
        filter: { _id: { $in: productIds }, force: true },
        options: { session },
      });
    }

    await session.commitTransaction();

    if (brand.logo) {
      void this.s3.deleteAsset({ Key: brand.logo }).catch((err) => {
        this.logger.error(`Failed to delete Brand Logo from S3: ${brand.logo}`, err);
      });
    }

    await Promise.all([
      this.redis.clearCacheKey({ key: CacheKeyEnum.PRODUCTS, isPublic: true }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.CATEGORY, isPublic: true }),
      this.redis.clearCacheKey({ key: CacheKeyEnum.BRAND, isPublic: true }),
    ]);

    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.BRAND_REMOVE,
      referenceId: brandId,
      referenceModel: ReferenceModelEnum.BRAND,
      metadata: { name: brand.name, type: 'HARD_DELETE_CASCADE' },
    });

    this.eventEmitter.emit('brand.deleted', {
      brandId,
      productIds,
      name: brand.name,
      actorId: user._id,
    });

    return 'Brand and all associated products permanently deleted successfully';
  } catch (error: any) {
    await session.abortTransaction();
    throw new BadRequestException(error?.message || 'Failed to hard delete brand');
  } finally {
    await session.endSession();
  }
  }
}
 