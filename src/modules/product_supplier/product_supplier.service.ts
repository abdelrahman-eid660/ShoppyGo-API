import {  ProductVariantRepository , ProductSupplierRepository } from 'src/DB/Repository';
import { SupplierRepository } from './../../DB/Repository/supplier.repository';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateProductSupplierDto } from './dto/create-product_supplier.dto';
import { UpdateProductSupplierDto } from './dto/update-product_supplier.dto';
import { HUserDocument } from 'src/DB/models';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { IPagination, IProductSupplier } from 'src/common/interface';
import { Types } from 'mongoose';
import { PaginationDTO } from 'src/common/dto';
import { LogActionEnum, ProductSupplierSortEnum, ReferenceModelEnum, SortEnum } from 'src/common/enum';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ProductSupplierService {
  constructor(
    private readonly supplierRepository : SupplierRepository,
    private readonly productSupplierRepository : ProductSupplierRepository,
    private readonly productVariantRepository : ProductVariantRepository,
    private readonly eventEmitter : EventEmitter2

  ){}
  async create({costPrice , currency , isActive ,isPrimary ,leadTimeDays ,minOrderQuantity ,supplierId ,productVariantId}: CreateProductSupplierDto , user : HUserDocument):Promise<IProductSupplier> {
    supplierId = TransformToObjectId(supplierId as unknown as string)
    productVariantId = TransformToObjectId(productVariantId as unknown as string)
    const productSupplierExist = await this.productSupplierRepository.findOne({filter :  {supplierId , productVariantId}})
    if (productSupplierExist) throw new ConflictException("ProductSupplier already exist")

    const [isVariantPrimary, supplierExist, productVariantExists] = await Promise.all([
      isPrimary === true ? this.productSupplierRepository.findOne({ filter: { productVariantId, isPrimary: true } }) : null,
      this.supplierRepository.findOne({ filter: { _id: supplierId } }),
      this.productVariantRepository.findOne({ filter: { _id: productVariantId } })
    ]);
    if (!supplierExist) throw new NotFoundException("Supplier not exists");
    if (!productVariantExists) throw new NotFoundException("Product variant not exists");
    if (isPrimary === true && isVariantPrimary) {
      throw new ConflictException("There is already another primary supplier assigned to this product variant.");
    }
    const variantTitleSnapshot =  productVariantExists?.sku ?? '';
    const productSupplier = await this.productSupplierRepository.create({data : {costPrice , variantTitleSnapshot , currency , isActive ,isPrimary ,leadTimeDays ,minOrderQuantity , productVariantId , supplierId , createdBy : user._id}})
    if (!productSupplier) throw new BadRequestException("Fail to add this product supplier")
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.PRODUCT_SUPPLIER_CREATE,referenceId: productSupplier._id,
      referenceModel: ReferenceModelEnum.PRODUCT_SUPPLIER,
      metadata: { 
        sku: variantTitleSnapshot, costPrice, 
        currency,isPrimary 
      }
    });
    this.eventEmitter.emit('product-supplier.created', {    
      productSupplierId: productSupplier._id,supplierId,
      productVariantId,sku: variantTitleSnapshot,costPrice,
      currency,isPrimary,leadTimeDays,actorId: user._id,
    });
    return productSupplier
  }

  async update(productSupplierId : Types.ObjectId , data: UpdateProductSupplierDto , user : HUserDocument):Promise<IProductSupplier> {
    const ProductSupplierExists = await this.productSupplierRepository.findOne({ filter: { _id: productSupplierId } });
    if (!ProductSupplierExists) throw new NotFoundException("Product supplier not exists");
    const supplierId = data.supplierId ? TransformToObjectId(data.supplierId as unknown as string) : ProductSupplierExists.supplierId;
    const productVariantId = data.productVariantId ? TransformToObjectId(data.productVariantId as unknown as string) : ProductSupplierExists.productVariantId;
    if (data.supplierId || data.productVariantId) {
      const checkDuplicateProductSupplier = await this.productSupplierRepository.findOne({filter : {_id : {$ne : productSupplierId} , supplierId , productVariantId}})
      if (checkDuplicateProductSupplier) {
        throw new ConflictException("There is already supplier assigned to this product variant.")
      }
    }
    const [supplierExist , productVariantExists] = await Promise.all([
    supplierId ?  this.supplierRepository.findOne({filter : {_id : supplierId as Types.ObjectId}}) : undefined,
    productVariantId ? this.productVariantRepository.findOne({filter : {_id : productVariantId as Types.ObjectId}}) : undefined
    ])
    if (data.supplierId &&!supplierExist) throw new NotFoundException("Supplier not found")
    if (data.productVariantId && !productVariantExists) throw new NotFoundException("ProductVaraint not found")
    if (data.isPrimary !== undefined) {
      if (data.isPrimary === true) {
        const isProductSupplierPrimary = await this.productSupplierRepository.findOne({filter : {_id : {$ne : productSupplierId} , productVariantId , isPrimary : true }})
        if(isProductSupplierPrimary) throw new ConflictException("There is already another supplier isPrimary with this variant")
      }
    }
    const variantTitleSnapshot = productVariantExists ? (productVariantExists.sku ?? '') : ProductSupplierExists.variantTitleSnapshot;
    const updateData = { ...data, supplierId , productVariantId, variantTitleSnapshot,updatedBy: user._id};
    const productSupplier = await this.productSupplierRepository.findOneAndUpdate({filter : {_id : productSupplierId},update : {$set : {updateData}}})
    if (!productSupplier) throw new BadRequestException("Fail to update this product supplier")
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.PRODUCT_SUPPLIER_UPDATE,
      referenceId: productSupplierId,referenceModel: ReferenceModelEnum.PRODUCT_SUPPLIER,
      metadata: { 
        sku: productSupplier.variantTitleSnapshot,changedFields: Object.keys(data)
      }
    });
    this.eventEmitter.emit('product-supplier.updated', {
      productSupplierId,supplierId,productVariantId,
      sku: productSupplier.variantTitleSnapshot,costPrice: data.costPrice,
      isPrimary: data.isPrimary,changedFields: Object.keys(data),actorId: user._id,
    });
    return productSupplier
  }

  async remove(productSupplierId: Types.ObjectId , user : HUserDocument) : Promise<string> {
    const productSupplier = await this.productSupplierRepository.findOneAndDelete({filter : {_id : productSupplierId} , options : {returnDocument : "before"}})
    if (!productSupplier) {
      throw new NotFoundException("Fail to delete this product supplier")
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.PRODUCT_SUPPLIER_REMOVE,
      referenceId: productSupplierId,
      referenceModel: ReferenceModelEnum.PRODUCT_SUPPLIER,
      metadata: { 
        sku: productSupplier.variantTitleSnapshot,
        deletedCostPrice: productSupplier.costPrice
      }
    });
    this.eventEmitter.emit('product-supplier.removed', {
      productSupplierId,supplierId: productSupplier.supplierId,
      productVariantId: productSupplier.productVariantId,
      sku: productSupplier.variantTitleSnapshot,
      deletedCostPrice: productSupplier.costPrice,actorId: user._id,
    });
    return `${productSupplier.variantTitleSnapshot} deleted successfuly`
  }

  async findAll(query : PaginationDTO) : Promise<IPagination<IProductSupplier>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search} = query || {};
    const sortOption = ProductSupplierSortEnum[sort] || ProductSupplierSortEnum[SortEnum.NEWEST]
    const productSuppliers = await this.productSupplierRepository.paginate({
      filter : {...(search) ? {productOrVariantSnapShot : new RegExp(search , 'i')} : {}},
      limit , page , sort : sortOption
    })
    return productSuppliers
  }

  async findOne(productSupplierId: Types.ObjectId) : Promise<IProductSupplier> {
    const productSupplier = await this.productSupplierRepository.findOne({filter : {_id : productSupplierId} , options : {populate : [ {path : "productVariantId"} , {path : "supplierId"}]}})
    if (!productSupplier) {
      throw new NotFoundException("ProductSupplier not found")
    }
    return productSupplier
  }
}
