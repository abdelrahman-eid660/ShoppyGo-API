import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { HShippingZoneDocument, HUserDocument } from 'src/DB/models';
import { PaginationDTO } from 'src/common/dto';
import { Types } from 'mongoose';
import { IPagination, IShippingZone } from 'src/common/interface';
import { LogActionEnum, ReferenceModelEnum, ShippingZoneSortEnum, SortEnum } from 'src/common/enum';
import { ShippingZoneRepository } from 'src/DB/Repository';
import { CreateShippingZoneDto, UpdateShippingZoneDto } from './dto';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class ShippingZoneService {
  constructor(private readonly ShippingZoneRepository : ShippingZoneRepository , private readonly eventEmitter: EventEmitter2){}

  async create({estimatedDays , mainCost , governorate , isActive , price}: CreateShippingZoneDto , user :HUserDocument):Promise<IShippingZone> {
    const ShippingZoneExist = await this.ShippingZoneRepository.findOne({filter : {governorate}})
    if(ShippingZoneExist) throw new ConflictException(`Shipping zone of ${ShippingZoneExist.governorate} already exist`)
    const ShippingZone = await this.ShippingZoneRepository.create({data : {estimatedDays , mainCost , governorate , isActive , price , createdBy : user._id}})
    if(!ShippingZone) throw new BadRequestException("Fail to create shipping zone")
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SHIPPINGZONE_CREATE,
      referenceId: ShippingZone._id,referenceModel: ReferenceModelEnum.SHIPPING_ZONE,
      metadata: {
        governorate: ShippingZone.governorate,mainCost: ShippingZone.mainCost,
        price: ShippingZone.price,estimatedDays: ShippingZone.estimatedDays
      }
    });
    this.eventEmitter.emit('shipping.zone.created', {
      shippingZoneId: ShippingZone._id, governorate: ShippingZone.governorate,
      price: ShippingZone.price, mainCost: ShippingZone.mainCost,
      estimatedDays: ShippingZone.estimatedDays,
      isActive: ShippingZone.isActive,actorId: user._id,
    });
    return ShippingZone
  }

  async findAll(query : PaginationDTO):Promise<IPagination<IShippingZone>> {
    const {limit = 4 , page = 1 , search, sort = SortEnum.NEWEST} = query
     const sortOptions = ShippingZoneSortEnum[sort] || ShippingZoneSortEnum[SortEnum.NEWEST]
     const shippingZones = await this.ShippingZoneRepository.paginate({
       filter : {...(search) && {governorate : new RegExp(search , 'i')}},
       limit , page , sort : sortOptions , options : {populate : [{path : "createdBy" , select : "firstName lastName profileImage"}]}
     })
     return shippingZones   
  }

  async findOne(shippingId: Types.ObjectId) : Promise<IShippingZone> {
    const ShippingZone = await this.ShippingZoneRepository.findOne({filter : {_id : shippingId} , options : {populate : [{path : "createdBy" , select : "firstName lastName profileImage role"}]}})
    if(!ShippingZone)throw new NotFoundException("Shipping zone not found")
    return ShippingZone
  }

  async update(shippingId: Types.ObjectId, {estimatedDays , mainCost , governorate , isActive , price}: UpdateShippingZoneDto , user : HUserDocument) : Promise<IShippingZone> {
    const update : Partial<HShippingZoneDocument> = {updatedBy : user._id}
    if(estimatedDays !== undefined) update.estimatedDays = estimatedDays 
    if(governorate !== undefined) update.governorate = governorate 
    if(isActive !== undefined) update.isActive = isActive 
    if(price !== undefined) update.price = price
    if(mainCost !== undefined) update.mainCost = mainCost
    const updateShippingZone = await this.ShippingZoneRepository.findOneAndUpdate({filter : {_id : shippingId} , update})
    if(!updateShippingZone) throw new NotFoundException("Shipping zone not found")
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SHIPPINGZONE_UPDATE,
      referenceId: shippingId,referenceModel: ReferenceModelEnum.SHIPPING_ZONE,
      metadata: {
        governorate: governorate || updateShippingZone.governorate,
        changedFields: Object.keys(update).filter(key => key !== 'updatedBy')
      }
    });
    this.eventEmitter.emit('shipping.zone.updated', {
      shippingZoneId: shippingId, governorate: updateShippingZone.governorate,
      price: updateShippingZone.price, mainCost: updateShippingZone.mainCost,
      estimatedDays: updateShippingZone.estimatedDays,isActive: updateShippingZone.isActive,
      changedFields: Object.keys(update).filter(key => key !== 'updatedBy'),actorId: user._id,
    });
    return updateShippingZone 
  }

  async remove(shippingId: Types.ObjectId , user : HUserDocument):Promise<string> {
    const ShippingZone = await this.ShippingZoneRepository.findOneAndDelete({filter : {_id : shippingId} , options : {returnDocument : "before"}})
    if(!ShippingZone)throw new NotFoundException("Shipping zone not found")
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.SHIPPINGZONE_REMOVE,
      referenceId: shippingId,referenceModel: ReferenceModelEnum.SHIPPING_ZONE,
      metadata: {
        governorate: ShippingZone.governorate,deletedPrice: ShippingZone.price
      }
    });
    this.eventEmitter.emit('shipping.zone.removed', {
      shippingZoneId: shippingId, governorate: ShippingZone.governorate,
      deletedPrice: ShippingZone.price,actorId: user._id,
    });
    return `Shipping zone ${ShippingZone.governorate} deleted successfuly`
  }
}
