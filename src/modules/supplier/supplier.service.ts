import { SupplierRepository } from './../../DB/Repository/supplier.repository';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { IPagination, ISupplier } from 'src/common/interface';
import { Types } from 'mongoose';
import { HUserDocument } from 'src/DB/models';
import { PaginationDTO } from 'src/common/dto';
import { LogActionEnum, ReferenceModelEnum, SortEnum, SupplierSortEnum } from 'src/common/enum';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateSupplierDto, UpdateSupplierDto } from './dto';

@Injectable()
export class SupplierService {
  constructor(
    private readonly supplierRepository : SupplierRepository ,
    private readonly eventEmitter : EventEmitter2
  ){}
  async create({address , email ,isActive ,name ,phone}: CreateSupplierDto , user : HUserDocument):Promise<ISupplier> {
    const supplierExist = await this.supplierRepository.findOne({filter : {$or : [{name} ,{ email}]}})
    if (supplierExist) {
      throw new ConflictException(`Supplier with this name or email already exists`)
    }
    const supplier = await this.supplierRepository.create({data : {address , email ,isActive ,name ,phone , createdBy : user._id}})
    if (!supplier) {
      throw new BadRequestException(`fail to add ${name} supplier to database`)
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SUPPLIER_CREATE,
      referenceId: supplier._id,referenceModel: ReferenceModelEnum.SUPPLIER,
      metadata: { name: supplier.name, email: supplier.email }
    });
    this.eventEmitter.emit('supplier.created', { 
      supplierId: supplier._id, name: supplier.name,
      email: supplier.email,phone: supplier.phone,
      isActive: supplier.isActive,actorId: user._id,
    });
    return supplier
  }

  async findAll(query : PaginationDTO):Promise<IPagination<ISupplier>> {
    const {limit = 4 , page = 1 , search  , sort = SortEnum.NAME_DESC} = query
    const sortOptions = SupplierSortEnum[sort] || SupplierSortEnum[SortEnum.NAME_DESC]
    const suppliers = await this.supplierRepository.paginate({page , limit , sort : sortOptions ,
       filter : {...(search) ? {$or : [{name : { $regex: search,$options: 'i',}} , {phone : search}]} :{} }
      })
    if (!suppliers.docs.length) {
      throw new NotFoundException("Suppliers are empty")
    }
    return suppliers
  }

  async findOne(supplierId: Types.ObjectId) : Promise<ISupplier> {
    const supplier = await this.supplierRepository.findOne({filter : {_id : supplierId} , options : {populate : [{path : "createdBy" , select : "firstName lastName role"}]}})
    if (!supplier) {
      throw new BadRequestException(`Fail to find this supplier`)
    }
    return supplier
  }

  async update(supplierId: Types.ObjectId, data: UpdateSupplierDto , user :HUserDocument):Promise<ISupplier> {
    if (data.email !== undefined) {
      const supplierExist = await this.supplierRepository.findOne({filter : {email : data.email , _id: { $ne: supplierId }}})
      if (supplierExist) {
        throw new ConflictException("This email already exists")
      }
    }
    const supplier = await this.supplierRepository.findOneAndUpdate({filter : {_id : supplierId} , update : {$set : {...data,updatedBy : user._id}}})
    if (!supplier) {
      throw new NotFoundException("Fail to update this supplier")
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SUPPLIER_UPDATE,
      referenceId: supplierId,referenceModel: ReferenceModelEnum.SUPPLIER,
      metadata: { name: supplier.name, changedFields: Object.keys(data) }
    });
    this.eventEmitter.emit('supplier.updated', {
      supplierId: supplier._id,name: supplier.name,changedFields: Object.keys(data),
      isActive: supplier.isActive,actorId: user._id,
    });
    return supplier
  }

  async remove(supplierId: Types.ObjectId , user : HUserDocument) : Promise<string> {
    const supplier = await this.supplierRepository.findOneAndDelete({filter : {_id : supplierId},options : {returnDocument : "before"}})
    if (!supplier) {
      throw new NotFoundException(`Supplier not found`)
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SUPPLIER_REMOVE,
      referenceId: supplierId,referenceModel: ReferenceModelEnum.SUPPLIER,
      metadata: { name: supplier.name, email: supplier.email }
    });
    this.eventEmitter.emit('supplier.removed', {
      supplierId: supplierId,name: supplier.name,
      email: supplier.email,actorId: user._id,
    });
    return `${supplier.name} deleted successfully`
  }
}
