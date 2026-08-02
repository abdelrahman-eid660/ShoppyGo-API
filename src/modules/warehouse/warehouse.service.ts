import { PurchaseProductsRepository } from './../../DB/Repository/purchaseProducts.repository';
import { InventoryRepository } from './../../DB/Repository/inventory.repository';
import { UserRepository } from './../../DB/Repository/user.repository';
import { S3Service } from './../../common/service/s3.service';
import { WareHouseRepository } from './../../DB/Repository/warehouse.repository';
import { BadRequestException, ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { CreateWarehouseDto, TransformDTO, UpdateWarehouseDto , WareHousePaginationDTO } from './dto';
import { HUserDocument } from 'src/DB/models';
import { IPagination, IWareHouse } from 'src/common/interface';
import { randomUUID } from 'crypto';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { PermissionEnum, PurchaseProcessStatusEnum, RoleEnum, SortEnum, WareHouseSortEnum } from 'src/common/enum';
import { Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class WarehouseService {
  constructor(
    private readonly wareHouseRepository : WareHouseRepository,
    private readonly userRepository : UserRepository,
    private readonly inventoryRepository : InventoryRepository,
    private readonly purchaseProductsRepository : PurchaseProductsRepository,
    private readonly s3 : S3Service,
    private readonly eventEmitter : EventEmitter2,
  ){}
  private readonly logger = new Logger(WarehouseService.name);
  async create(data: CreateWarehouseDto , user : HUserDocument) : Promise<IWareHouse> {
    let isMain : boolean = false
    if(data.isMain !== undefined || data.isMain === false){
      const wareHouses= await this.wareHouseRepository.findOne({filter:{isMain : true}})
      if (!wareHouses){
        isMain = true
      }else{
        throw new ConflictException(`You have already main wareHouse ${wareHouses?.name}`)
      } 
    }
    if(data.code !== undefined){
      const wareHouseExists = await this.wareHouseRepository.findOne({filter : {code : data.code}})
      if (wareHouseExists) {
        throw new ConflictException("WareHouse already exists with the same data")
      }
      const manger = await this.userRepository.findOne({
        filter :{
          _id : TransformToObjectId(data.manager as unknown as string) ,
          $or : [{role : RoleEnum.SUPERADMIN} , {role : RoleEnum.SUPERADMIN , permissions : PermissionEnum.WAREHOUSE_CREATE}]
        }
      })
      if (!manger) {
        throw new NotFoundException("This manger not found or unauthorized")
      }
      const warHouse = await this.wareHouseRepository.create({data : {...data , isMain , createdBy : user._id}})
      if (!warHouse) {
        if(data.coverImage) void this.s3.deleteAsset({Key : data.coverImage}).catch(err => this.logger.error(err))
        throw new BadRequestException("Fail to create warehouse")
      }
      this.eventEmitter.emit('warehouse.created', {
        warehouseId: warHouse._id,name: warHouse.name,
        code: warHouse.code,isMain: warHouse.isMain,
        managerId: warHouse.manager,actorId: user._id,
      });
      return warHouse
    }
    const code = `${data.name}-${randomUUID().slice(0,4)}`
    const manger = await this.userRepository.findOne({
      filter :{
        _id : TransformToObjectId(data.manager as unknown as string) ,
         $or : [{role : RoleEnum.SUPERADMIN} , {role : RoleEnum.SUPERADMIN , permissions : PermissionEnum.WAREHOUSE_CREATE}]
      }
    })
    if (!manger) {
      throw new NotFoundException("This manger not found or unauthorized")
    }
    const warHouse = await this.wareHouseRepository.create({data : {...data , isMain, code , createdBy : user._id}})
    if (!warHouse) {
      if(data.coverImage) void this.s3.deleteAsset({Key : data.coverImage}).catch(err => this.logger.error(err))
      throw new BadRequestException("Fail to creat this warehouse")
    }
    this.eventEmitter.emit('warehouse.created', {
      warehouseId: warHouse._id,name: warHouse.name,
      code: warHouse.code,isMain: warHouse.isMain,
      managerId: warHouse.manager,actorId: user._id,
    });
    return warHouse
  }

  async findAll(query : WareHousePaginationDTO):Promise<IPagination<IWareHouse>> {
    const {limit = 4 , page , sort = SortEnum.NEWEST , search , status} = query
    const sortOptions = WareHouseSortEnum[sort] || WareHouseSortEnum[SortEnum.NEWEST]
    const wareHouses = await this.wareHouseRepository.paginate({
      filter : {...(search) && {name : new RegExp(search , 'i')} , ...(status && {isActive : status})},
      limit , page , sort : sortOptions , options : {populate : [{path : "manager" , select : "firstName lastName profileImage"}]}
    })
    return wareHouses
  }

  async findOne(wareHouseId: Types.ObjectId) : Promise<IWareHouse> {
    const wareHouse = await this.wareHouseRepository.findOne({filter : {_id : wareHouseId} , options : {populate : [{path : "manager" , select : "firstName lastName role profileImage phone email"} , {path : "createdBy" , select : "firstName lastName role"}]}})
    if (!wareHouse) {
      throw new NotFoundException("Warehouse not found")
    }
    return wareHouse
  }

  async update(wareHouseId: Types.ObjectId, data: UpdateWarehouseDto , user : HUserDocument) : Promise<IWareHouse> {
    let managerId : Types.ObjectId | undefined;
    let oldImage = null
    const wareHouseExist = await this.wareHouseRepository.findOne({filter : {_id : wareHouseId}})
    if (!wareHouseExist) {
      throw new NotFoundException("WareHouse not found")
    }
    oldImage = wareHouseExist.coverImage
    if(data.manager !== undefined){
      managerId = TransformToObjectId(data.manager as unknown as string)
      const manager = await this.userRepository.findOne({filter : {_id : managerId , $or : [{role : RoleEnum.SUPERADMIN} , {role : RoleEnum.ADMIN , permissions : PermissionEnum.WAREHOUSE_UPDATE}]}})
      if (!manager) {
        throw new NotFoundException("This manager not found or unauthorized")
      }
    }
    if(data.name !== undefined){
      const wareHouse = await this.wareHouseRepository.findOne({filter : {name : data.name , _id : {$ne : wareHouseId}}})
      if(wareHouse) throw new ConflictException("This name already exists")
    }
    if(data.code !== undefined){
      const wareHouse = await this.wareHouseRepository.findOne({filter : {code : data.code , _id : {$ne : wareHouseId}}})
      if(wareHouse) throw new ConflictException("This code already exists")
    }
    let isMain : boolean = false
    if(data.isMain !== undefined){
      if (data.isMain === true) {
        const wareHouses= await this.wareHouseRepository.findOne({filter:{isMain : true}})
        if (!wareHouses){
          isMain = true
        }else{
          throw new ConflictException(`You have already main wareHouse ${wareHouses?.name}`)
        }        
      }else {
        const wareHouses= await this.wareHouseRepository.findOne({filter:{isMain : true , _id : {$ne : wareHouseId}}})
        if (!wareHouses){
          throw new BadRequestException(`Can't change from main warehouse to branch at least one main`)
        }else{
          isMain = false
        }        
      }
    }
    const wareHouse = await this.wareHouseRepository.findOneAndUpdate({filter : {_id : wareHouseId} , update : {$set : {...data , isMain , manager : managerId , updatedBy : user._id}} , options : {returnDocument : "after"}})
    if (!wareHouse) {
      throw new BadRequestException("Fail to set new updates")
    }
    if(data.coverImage){
      if (oldImage) {
        void this.s3.deleteAsset({Key : oldImage}).catch(err => this.logger.error(err))
      }
    }
    this.eventEmitter.emit('warehouse.updated', {
      warehouseId: wareHouseId,
      name: data.name ?? wareHouseExist.name, code: data.code ?? wareHouseExist.code,
      isMain: data.isMain !== undefined ? isMain : wareHouseExist.isMain,
      isActive: data.isActive !== undefined ? data.isActive : wareHouseExist.isActive,
      hasManagerChanged: data.manager !== undefined, changedFields: Object.keys(data),
      actorId: user._id,
    });
    return wareHouse
  }

  async remove(wareHouseId: Types.ObjectId , user : HUserDocument) : Promise<string> {
    const wareHouseExist = await this.wareHouseRepository.findOne({filter : {_id : wareHouseId , isActive : false , isMain : {$ne : true}} , options : {returnDocument : "before"}})
    if (!wareHouseExist) {
      throw new NotFoundException("Warehouse not found")
    }
    if (wareHouseExist.isMain === true) {
      throw new BadRequestException("Can't delete main warehouse")
    }
    const inventory = await this.inventoryRepository.findOne({filter : {wareHouseId}})
    if (inventory) {
      throw new BadRequestException("Inventory have still have products")
    }
    const purchaseProducts = await this.purchaseProductsRepository.find({filter : {wareHouseId , status : {$ne : PurchaseProcessStatusEnum.CANCELLED}}})
    if (purchaseProducts.length) {
      throw new BadRequestException("there are still productsVariant in this warehouse")
    }
    const wareHouse = await this.wareHouseRepository.findOneAndDelete({filter : {_id : wareHouseId , isActive : false , isMain : {$ne : true}} , options : {returnDocument : "before"}})
    if (!wareHouse) {
      throw new NotFoundException("Fail to delete warehouse or warehouse not found")
    }
    if (wareHouse?.coverImage) {
      void this.s3.deleteAsset({Key : wareHouse.coverImage}).catch(err => this.logger.error(err))
    }
    this.eventEmitter.emit('warehouse.removed', {
      warehouseId: wareHouseId, name: wareHouseExist.name,
      code: wareHouseExist.code,actorId: user._id,
    });
    return `${wareHouse.name} WareHouse deleted successfuly`
  }
}
