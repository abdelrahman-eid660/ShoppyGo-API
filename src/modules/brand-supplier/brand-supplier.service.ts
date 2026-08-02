import { BrandRepository } from './../../DB/Repository/brand.repository';
import { SupplierRepository } from './../../DB/Repository/supplier.repository';
import { BrandSupplierRepository } from './../../DB/Repository/brandSupplier.repository';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateBrandSupplierDto , UpdateBrandSupplierDto } from './dto';
import { Types } from 'mongoose';
import { HBrandSupplierDocument, HUserDocument } from 'src/DB/models';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { IBrandSupplier, IPagination } from 'src/common/interface';
import { BrandSupplierSortEnum, LogActionEnum, ReferenceModelEnum, SortEnum } from 'src/common/enum';
import { PaginationDTO } from 'src/common/dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class BrandSupplierService {
  constructor(
    private readonly brandSupplierRepository : BrandSupplierRepository,
    private readonly supplierRepository : SupplierRepository,
    private readonly brandRepository : BrandRepository,
    private readonly eventEmitter : EventEmitter2,
  ){}

  async create({brandId , supplierId , isActive , isPrimary}: CreateBrandSupplierDto , user : HUserDocument) : Promise<IBrandSupplier> {
    brandId = TransformToObjectId(brandId as unknown as string)
    supplierId = TransformToObjectId(supplierId as unknown as string)
    const brandSupplierExist = await this.brandSupplierRepository.findOne({filter : {brandId , supplierId}})
    if (brandSupplierExist) {
      throw new ConflictException("This Brand-Supplier relation already exists")
    }
    const [isBrandPrimary, brandExist, supplierExist] = await Promise.all([
      isPrimary === true ? this.brandSupplierRepository.findOne({filter : {brandId , isPrimary : true}}) : null,
      this.brandRepository.findOne({filter : {_id : brandId}}),
      this.supplierRepository.findOne({filter : {_id :supplierId}}),
    ])
    if (isPrimary === true && isBrandPrimary) {
      throw new ConflictException("There is already a primary supplier assigned to this brand. Change the other supplier to false first.")
    }
    if(!brandExist) throw new NotFoundException("Brand not found")
    if(!supplierExist) throw new NotFoundException("Supplier not found")

    const brandSupplier = await this.brandSupplierRepository.create({data : {brandId , supplierId , brandNameSnapshot : brandExist.name , supplierNameSnapshot : supplierExist.name , isActive , isPrimary , createdBy : user._id}})
    if(!brandSupplier) throw new BadRequestException("Fail to create brand supplier")
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.Brand_SUPPLIER_CREATE,
      referenceId: brandSupplier._id,referenceModel: ReferenceModelEnum.BRAND_SUPPLIER,
      metadata: { 
        brandName: brandExist.name, 
        supplierName: supplierExist.name,
        isPrimary 
      }
    });
    this.eventEmitter.emit('brand-supplier.created', {
      brandSupplierId: brandSupplier._id,brandName: brandExist.name,
      supplierName: supplierExist.name,isPrimary: brandSupplier.isPrimary,
      isActive: brandSupplier.isActive,actorId: user._id,
    });
    return brandSupplier
  }

  async findAll(query : PaginationDTO) : Promise<IPagination<IBrandSupplier>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search} = query || {};
    const sortOption = BrandSupplierSortEnum[sort] || BrandSupplierSortEnum[SortEnum.NEWEST]
    const brandsSupplier = await this.brandSupplierRepository.paginate({
      filter : {
      ...(search && {brandNameSnapshot : new RegExp(search , 'i')}),
      ...(search && {supplierNameSnapshot : new RegExp(search , 'i')}),
      },
      limit , page , sort : sortOption})
    return brandsSupplier;
  }

  async findOne(brandSupplierId: Types.ObjectId):Promise<IBrandSupplier> {
    const brandSupplier = await this.brandSupplierRepository.findOne({filter : {_id :brandSupplierId} , options : {populate : [{path : "createdBy" , select : "firstName lastName"},{path : "updatedBy" , select : "firstName lastName"} , {path : "brandId"} , {path : "supplierId"}]}})
    if (!brandSupplier) {
      throw new NotFoundException("BrandSupplier not found")
    }
    return brandSupplier
  }

  async update(brandSupplierId: Types.ObjectId, {isActive , isPrimary}: UpdateBrandSupplierDto , user : HUserDocument) : Promise<IBrandSupplier> {
    const brandSupplierExist = await this.brandSupplierRepository.findOne({filter : {_id : brandSupplierId}})
    if(!brandSupplierExist) throw new NotFoundException("Brand supplier relation not found")
    const update : Partial<HBrandSupplierDocument> = {}
    if(isActive !== undefined) update.isActive = isActive
    if(isPrimary !== undefined){
      if (isPrimary === true) {
        const isBrandPrimary = await this.brandSupplierRepository.findOne({filter : {_id : {$ne : brandSupplierId},brandId : brandSupplierExist.brandId , isPrimary : true}})
        if (isBrandPrimary) {
          throw new ConflictException("There is already the same Brand supplier primary with another supplier, change it to false or change the primary from another supplier to false ")
        }
      }
      update.isPrimary = isPrimary
    } 
    const brandSupplier = await this.brandSupplierRepository.findOneAndUpdate({filter : {_id : brandSupplierId} , update : {$set : {...update , updatedBy : user._id}} , options : {returnDocument : "after"}})
    if(!brandSupplier) throw new BadRequestException(`Fail to update brand supplier`)
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.Brand_SUPPLIER_UPDATE,referenceId: brandSupplierId,
      referenceModel: ReferenceModelEnum.BRAND_SUPPLIER,
      metadata: { 
        brandName: brandSupplier.brandNameSnapshot, 
        supplierName: brandSupplier.supplierNameSnapshot,
        changedFields: Object.keys(update)
      }
    });
    this.eventEmitter.emit('brand-supplier.updated', {
      brandSupplierId: brandSupplier._id,brandName: brandSupplier.brandNameSnapshot,
      supplierName: brandSupplier.supplierNameSnapshot,isPrimary: brandSupplier.isPrimary,
      isActive: brandSupplier.isActive,changedFields: Object.keys(update),actorId: user._id,
    });
    return brandSupplier
  }

  async remove(brandSupplierId: Types.ObjectId , user : HUserDocument) : Promise<string> {
    const brandSupplier = await this.brandSupplierRepository.findOneAndDelete({filter : {_id : brandSupplierId} , options : {returnDocument : "before"}})
    if(!brandSupplier) throw new NotFoundException("Brand supplier not found")
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.Brand_SUPPLIER_REMOVE,
      referenceId: brandSupplierId,referenceModel: ReferenceModelEnum.BRAND_SUPPLIER,
      metadata: { 
        brandName: brandSupplier.brandNameSnapshot, 
        supplierName: brandSupplier.supplierNameSnapshot 
      }
    });
    this.eventEmitter.emit('brand-supplier.removed', {
      brandSupplierId: brandSupplierId,brandName: brandSupplier.brandNameSnapshot,
      supplierName: brandSupplier.supplierNameSnapshot,actorId: user._id,
    });
    return `${brandSupplier.supplierNameSnapshot} supplier deleted his ${brandSupplier.brandNameSnapshot} successfuly`
  }
}
