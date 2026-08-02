/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { InventoryMovementRepository } from './../../DB/Repository/inventory_movement.repository';
import { InventoryRepository } from './../../DB/Repository/inventory.repository';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateWarehouseTransformDto, PaginationWareHouseTransformDTO, UpdateWarehouseTransformDto } from './dto';
import { HUserDocument, HWareHouseDocument } from 'src/DB/models';
import { Types } from 'mongoose';
import { WareHouseRepository, WareHouseTransformRepository } from 'src/DB/Repository';
import { IPagination, IWareHouseTransform, IWareHouseTransformItems } from 'src/common/interface';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { ActionStockTypeEnum, InventoryMovementType, LogActionEnum, OperationEnum, ReferenceModelEnum, SharedStatusEnum, SortEnum, WareHouseTransformSortEnum } from 'src/common/enum';
import { InventoryMovementService } from 'src/common/service';
import { DatabaseService } from 'src/DB/service/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IStockChangedPayload } from 'src/common/listener';


@Injectable()
export class WarehouseTransformService {
  constructor(
    private readonly wareHouseRepository : WareHouseRepository,
    private readonly wareHouseTransformRepository : WareHouseTransformRepository,
    private readonly InventoryRepository : InventoryRepository,
    private readonly InventoryMovementRepository : InventoryMovementRepository,
    private readonly dataBaseService : DatabaseService,   
    private readonly inventoryMovementService : InventoryMovementService,
    private readonly eventEmitter : EventEmitter2
  ){}
  private async validateTransferItems(items : IWareHouseTransformItems[]):Promise<IWareHouseTransformItems[] | undefined>{
    if(!items.length)return
    const ids = items.map(item => TransformToObjectId(item.productVariantId as unknown as string))
    const inventory = await this.InventoryRepository.find({filter : {productVariantId : {$in : ids}}})
    if (inventory.length !== ids.length) {
      throw new BadRequestException("Some product variants are not found in warehouse inventory")
    }
    const inventoryMap = new Map(inventory.map(item => [item.productVariantId.toString() , item]))
    const transformItems  = items.map(item => {
      const inventory  = inventoryMap.get(item.productVariantId.toString())
      if (!inventory ) {
        throw new NotFoundException("Product variant not found")
      }
      if (inventory.availableQuantity < item.quantity ) {
        throw new BadRequestException(`${inventory.skuSnapshot} available quantity is not enough`)
      }
      if (item.quantity < 1 ) {
        throw new BadRequestException(`Can't transform 0 quantity `)
      }
      return {
        productVariantId: inventory.productVariantId,
        quantity: item.quantity , 
        productVariantNameSnapshot: inventory.skuSnapshot as string
      }
    })
    return transformItems 
  }
  
  async findAll(query : PaginationWareHouseTransformDTO):Promise<IPagination<IWareHouseTransform>> {
    const {limit = 4 , page , sort = SortEnum.NEWEST , search , status} = query
    const sortOptions = WareHouseTransformSortEnum[sort] || WareHouseTransformSortEnum[SortEnum.NEWEST]
    const wareHouseTransforms = await this.wareHouseTransformRepository.paginate({
      filter: {
        ...(search && {"items.productVariantNameSnapshot": new RegExp(search, "i")}),
        ...(status && { status }),
      },
      limit,page,sort: sortOptions,options: {
        populate: [
          {path: "createdBy", select: "firstName lastName profileImage"},
          {path: "approvedBy", select: "firstName lastName profileImage"},
          {path: "fromWarehouseId",select: "name code"},
          {path: "toWarehouseId",select: "name code"},
          {path: "items.productVariantId",select: "sku"},
        ],
      },
    });
    return wareHouseTransforms
  }
  
  async findOne(wareHouseTransfornId: Types.ObjectId):Promise<IWareHouseTransform> {
    const wareHouseTransform = await this.wareHouseTransformRepository.findOne({filter : {_id : wareHouseTransfornId} , options : 
      {populate: [
        {path: "createdBy", select: "firstName lastName role profileImage"},
        {path: "updatedBy",select: "firstName lastName role profileImage"},
        {path: "approvedBy", select: "firstName lastName role profileImage"},
        {path: "fromWarehouseId", select: "name code address"},
        {path: "toWarehouseId",select: "name code address"},
        {path: "items.productVariantId", select: "sku price images attributes"},
      ]}
    })
    if(!wareHouseTransform) throw new NotFoundException("Warehoust transform not found")
      return wareHouseTransform
  }

  async create({fromWarehouseId , toWarehouseId , items , leaveAt , notes}: CreateWarehouseTransformDto , user : HUserDocument):Promise<IWareHouseTransform> {
    fromWarehouseId = TransformToObjectId(fromWarehouseId as unknown as string)
    toWarehouseId = TransformToObjectId(toWarehouseId as unknown as string)
    if (fromWarehouseId.equals(toWarehouseId)) {
      throw new BadRequestException("Source and destination warehouse can't be the same");
    }
    const [fromWarehouseExist , toWarehouseExist] = await Promise.all([
      this.wareHouseRepository.findOne({filter : {_id : fromWarehouseId , isActive : true}}),
      this.wareHouseRepository.findOne({filter : {_id : toWarehouseId , isActive : true}}),
    ])
    if(!fromWarehouseExist) throw new NotFoundException("Source warehouse not found")
    if(!toWarehouseExist) throw new NotFoundException("Destination warehouse not found")
    const result = await this.validateTransferItems(items)
    if(await this.wareHouseTransformRepository.findOne({filter : {fromWarehouseId , toWarehouseId , status : SharedStatusEnum.PENDING , leaveAt}})){
      throw new ConflictException("Warehouse transform already ordered")
    }
    const wareHouseTransform = await this.wareHouseTransformRepository.create({data : {fromWarehouseId , toWarehouseId , items : result  , leaveAt , notes , status : SharedStatusEnum.PENDING , createdBy : user._id}})
    if (!wareHouseTransform) {
      throw new BadRequestException("Fail to create warehouse transform")
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.WAREHOUSE_TRANSFORM_CREATE,
      referenceId: wareHouseTransform._id,referenceModel: ReferenceModelEnum.TRANSFER,
      metadata: {
        fromWarehouseId,toWarehouseId,itemsCount: result!.length,leaveAt
      }
    });
    this.eventEmitter.emit('warehouse-transform.created', {
      transformId: wareHouseTransform._id,
      fromWarehouseName: fromWarehouseExist.name,
      toWarehouseName: toWarehouseExist.name,
      itemsCount: result?.length,
      leaveAt: wareHouseTransform.leaveAt,
      actorId: user._id,
    });
    return wareHouseTransform
  }
  
  async update(wareHouseTransfornId: Types.ObjectId, {leaveAt , items , fromWarehouseId ,  notes  , toWarehouseId}: UpdateWarehouseTransformDto , user : HUserDocument):Promise<IWareHouseTransform> {
    const transformExist = await this.wareHouseTransformRepository.findOne({ filter: {_id: wareHouseTransfornId,status: SharedStatusEnum.PENDING}});
    if (!transformExist) {
      throw new NotFoundException("Warehouse transform not found or already processed");
    }
    const update : Partial<IWareHouseTransform> = {
      updatedBy : user._id
    }
    if(fromWarehouseId !== undefined){
      fromWarehouseId = TransformToObjectId(fromWarehouseId as unknown as string)
      const fromWarehouseExist  = await this.wareHouseRepository.findOne({filter : {_id : fromWarehouseId , isActive:true}})
      if(!fromWarehouseExist) throw new NotFoundException("Source warehouse not found")
      update.fromWarehouseId = fromWarehouseId
    }
    if(toWarehouseId !== undefined){
      toWarehouseId = TransformToObjectId(toWarehouseId as unknown as string)
      const fromWarehouseExist  = await this.wareHouseRepository.findOne({filter : {_id : toWarehouseId , isActive : true}})
      if(!fromWarehouseExist) throw new NotFoundException("Destination warehouse not found")
      update.toWarehouseId = toWarehouseId
    }
    const finalFromId = (update.fromWarehouseId ?? transformExist.fromWarehouseId) as Types.ObjectId;
    const finalToId = (update.toWarehouseId ?? transformExist.toWarehouseId) as Types.ObjectId;
    if (finalFromId.toString() === finalToId.toString()) {
      throw new BadRequestException("Source and destination warehouse can't be the same");
    }
    if(items?.length){
      update.items =  await this.validateTransferItems(items)
    }
    if (leaveAt !== undefined) update.leaveAt = leaveAt;
    if (notes !== undefined) update.notes = notes;
    const wareHouseTransform = await this.wareHouseTransformRepository.findOneAndUpdate({filter : {_id : wareHouseTransfornId , status: SharedStatusEnum.PENDING} , update : {$set : {update}}})
    if (!wareHouseTransform) {
      throw new BadRequestException("Failed to update warehouse transform");
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.WAREHOUSE_TRANSFORM_UPDATE,
      referenceId: wareHouseTransform._id,
      referenceModel : ReferenceModelEnum.TRANSFER,
      metadata: {
        updatedFields: Object.keys(update),
        leaveAt,
        notes
      }
    });
    return wareHouseTransform
  }
  
  async cancel(wareHouseTransfornId: Types.ObjectId , user : HUserDocument):Promise<string> {
    const wareHouseTransform = await this.wareHouseTransformRepository.findOneAndUpdate({filter : {_id : wareHouseTransfornId , status : SharedStatusEnum.PENDING} , update : {status : SharedStatusEnum.CANCELLED, updatedBy : user._id} , options : {populate : [{path : "toWarehouse" , select : "name"},{path : "fromWarehouse" , select : "name"}]}})
    if (!wareHouseTransform) {
      throw new NotFoundException( "Warehouse transform not found or already processed")
    }
    const toWarehouse = wareHouseTransform.toWarehouseId as HWareHouseDocument
    const fromWarehouse = wareHouseTransform.fromWarehouseId as HWareHouseDocument
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.WAREHOUSE_TRANSFORM_CANCEL,
      referenceId: wareHouseTransfornId,
      referenceModel: ReferenceModelEnum.TRANSFER,
      metadata: { status: SharedStatusEnum.CANCELLED }
    });
    this.eventEmitter.emit('warehouse-transform.cancelled', {
      transformId: wareHouseTransform._id,
      fromWarehouseName: fromWarehouse.name || 'N/A',
      toWarehouseName: toWarehouse.name || 'N/A',
      actorId: user._id,
    });
    return "Warehouse transform process cancelled successfully";
  }

  async approve(wareHouseTransformId: Types.ObjectId , user : HUserDocument):Promise<string> {
    const session = await this.dataBaseService.startSession();
    try { 
      session.startTransaction()
      const transform = await this.wareHouseTransformRepository.findOne({filter: {_id: wareHouseTransformId,status: SharedStatusEnum.PENDING,},options: { session }});
      if (!transform) {
        throw new NotFoundException("Warehouse transform not found");
      }
      const inventoryMap  = await this.inventoryMovementService.getInventoryMap({warehouseId : transform.fromWarehouseId as Types.ObjectId , items : transform.items , session})
      const warehouse = await this.wareHouseRepository.findOne({filter:{_id : transform.fromWarehouseId as Types.ObjectId , isActive : true },options:{session}});
      if (!warehouse) {
        throw new NotFoundException("Warehouse not found");
      }
      const inventoryUpdates = [];
      const movements = [];
      const stockEvents: IStockChangedPayload[] = [];
      for(const item of transform.items){
        const inventory = inventoryMap.get(item.productVariantId.toString());
        if(!inventory){
          throw new NotFoundException(`Inventory not found`);
        }
        if (inventory.availableQuantity < item.quantity) {
          throw new BadRequestException(`Insufficient available stock for variant [${item.productVariantId.toString()}]. Required: ${item.quantity}, Available: ${inventory.availableQuantity}`);
        }
        const beforeQuantity = inventory.quantity;
        const afterQuantity = beforeQuantity-item.quantity;
        inventoryUpdates.push(this.inventoryMovementService.buildInventoryTransformUpdate(inventory , item.quantity , user._id , OperationEnum.DECREASE))
        movements.push(this.inventoryMovementService.buildInventoryMovementTransform({
          inventory , warehouse , item , beforeQuantity , afterQuantity , type : InventoryMovementType.TRANSFER_OUT,
          referenceId : transform._id , referenceModel : ReferenceModelEnum.TRANSFER , createdBy : user._id
        }))
        stockEvents.push({
          inventoryId: inventory._id.toString(),productVariantId: item.productVariantId.toString(),
          sku: inventory.skuSnapshot as string, warehouseId: transform.fromWarehouseId.toString(),
          previousAvailableQuantity: inventory.availableQuantity,
          newAvailableQuantity: inventory.availableQuantity - item.quantity,
          lowStockThreshold: inventory.lowStockThreshold,
          actionType: ActionStockTypeEnum.WAREHOUSE_TRANSFER,
        });
      }
      const updatedInventory = await this.InventoryRepository.bulkWrite(inventoryUpdates,{session,ordered:true});
      if (!updatedInventory) {
        throw new BadRequestException("Failed to update inventory");
      }
      const inventoryMovement = await this.InventoryMovementRepository.create({data:movements,options:{session , ordered : true}});
      if(!inventoryMovement) throw new BadRequestException("Fail to create inventory movement")
      const wareHouseTransform = await this.wareHouseTransformRepository.findOneAndUpdate({filter:{_id:transform._id},update:{status:SharedStatusEnum.APPROVED,approvedBy:user._id,approvedAt:new Date()},options:{session , returnDocument : "after", populate : [{path : "fromWarehouseId" , select : "name"} , {path : "toWarehouseId" , select : "name"}]}});
      if(!wareHouseTransform) throw new NotFoundException("wareHouse transform not found")
      await session.commitTransaction()
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,
        action: LogActionEnum.WAREHOUSE_TRANSFORM_APPROVE,
        referenceId: transform._id,
        referenceModel: ReferenceModelEnum.TRANSFER,
        metadata: {
          fromWarehouseId: transform.fromWarehouseId,
          toWarehouseId: transform.toWarehouseId,
          itemsApproved: transform.items.map(i => ({ variantId: i.productVariantId, qty: i.quantity }))
        }
      });
      for (const eventPayload of stockEvents) {
        this.eventEmitter.emit('inventory.stock_changed', eventPayload);
      }
      const toWarehouse = wareHouseTransform.toWarehouseId as HWareHouseDocument
      const fromWarehouse = wareHouseTransform.fromWarehouseId as HWareHouseDocument
      this.eventEmitter.emit('warehouse-transform.approved', {
        transformId: transform._id, fromWarehouseName: fromWarehouse.name,
        toWarehouseName: toWarehouse.name, actorId: user._id
      });
      return "Warehouse transform approved successfully";
    }catch (error : any) {
      await session.abortTransaction();
      throw new BadRequestException(error.message);
    } 
    finally {
      await session.endSession();
    }
  }

  async receive(wareHouseTransfornId: Types.ObjectId , user : HUserDocument):Promise<string> {
    const session = await this.dataBaseService.startSession()
    try {
      session.startTransaction()
      const wareHouseTransform = await this.wareHouseTransformRepository.findOne({filter : {_id : wareHouseTransfornId , status : SharedStatusEnum.APPROVED} , options : {session}})
      if (!wareHouseTransform) {
        throw new NotFoundException(`Warehouse transform not found`)
      }
      const wareHouseReceiver = await this.wareHouseRepository.findOne({filter : {_id : wareHouseTransform.toWarehouseId as Types.ObjectId , isActive : true},options : {session}})
      if (!wareHouseReceiver) {
        throw new NotFoundException("Destination warehouse not found")
      }
      const inventoryMap  = await this.inventoryMovementService.getInventoryMap({warehouseId : wareHouseTransform.toWarehouseId as Types.ObjectId , items : wareHouseTransform.items , session , type : 'receive'})
      const inventoryUpdates  = [];
      const movements = [];
      const stockChangeSnapshots: any[]= [];
      for (const item of wareHouseTransform.items) {
        let inventory = inventoryMap.get(item.productVariantId.toString())
        if (!inventory) {
          inventory = await this.InventoryRepository.createOne({data : {
            wareHouseId : wareHouseReceiver._id , productVariantId : item.productVariantId , createdBy : user._id,
            availableQuantity : 0 , quantity : 0 , reserved : 0 , lastStockUpdate : new Date() , sold : "0",
            productTitleSnapshot : item.productVariantNameSnapshot
          },options : {session , ordered : true}})
          inventoryMap.set(item.productVariantId.toString() , inventory)
        }
        const beforeQuantity = inventory.quantity
        const afterQuantity = beforeQuantity+item.quantity;
        stockChangeSnapshots.push({inventory,item,previousAvailable: inventory.availableQuantity,
          newAvailable: inventory.availableQuantity + item.quantity,
        });
        inventoryUpdates.push(this.inventoryMovementService.buildInventoryTransformUpdate(inventory , item.quantity , user._id , OperationEnum.INCREAS))
        movements.push(this.inventoryMovementService.buildInventoryMovementTransform({
          inventory , warehouse : wareHouseReceiver , item , beforeQuantity , afterQuantity,
          type : InventoryMovementType.TRANSFER_IN , referenceId : wareHouseTransform._id , referenceModel : ReferenceModelEnum.TRANSFER, createdBy : user._id
        }))
      }
      const updatedInventory = await this.InventoryRepository.bulkWrite(inventoryUpdates,{session,ordered:true});
      if (!updatedInventory) {
        throw new BadRequestException("Failed to update inventory");
      }
      const inventoryMovement = await this.InventoryMovementRepository.create({data:movements,options:{session , ordered : true}});
      if(!inventoryMovement) throw new BadRequestException("Fail to create inventory movement")
      const signTransform = await this.wareHouseTransformRepository.findOneAndUpdate({filter : {_id : wareHouseTransfornId , status : SharedStatusEnum.APPROVED},update : {status : SharedStatusEnum.RECEVIED , transformedAt : new Date()},options:{session , returnDocument : "after" , populate : [{path : "fromWarehouseId" , select : "name"} , {path : "toWarehouseId" , select : "name"}]}})
      if(!signTransform) throw new NotFoundException("wareHouse transform not found")
      await session.commitTransaction()
      for (const snap of stockChangeSnapshots) {
        this.eventEmitter.emit('inventory.stock_changed', {
          inventoryId: snap.inventory._id.toString(),
          productVariantId: snap.item.productVariantId.toString(),
          sku: snap.inventory.skuSnapshot,
          productTitle: snap.item.productVariantNameSnapshot,
          warehouseId: wareHouseTransform.toWarehouseId.toString(),
          warehouseName: wareHouseReceiver.name,
          previousAvailableQuantity: snap.previousAvailable,
          newAvailableQuantity: snap.newAvailable,
          lowStockThreshold: snap.inventory.lowStockThreshold || 0,
          actionType: ActionStockTypeEnum.WAREHOUSE_TRANSFER,
        } as IStockChangedPayload);
      }
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,
        action: LogActionEnum.WAREHOUSE_TRANSFORM_RECEIVE,
        referenceId: wareHouseTransform._id,
        referenceModel: ReferenceModelEnum.TRANSFER,
        metadata: {
          toWarehouseId: wareHouseTransform.toWarehouseId,
          fromWarehouseId: wareHouseTransform.fromWarehouseId,
          receivedAt: new Date()
        }
      });
      const toWarehouse = wareHouseTransform.toWarehouseId as HWareHouseDocument
      const fromWarehouse = wareHouseTransform.fromWarehouseId as HWareHouseDocument
      this.eventEmitter.emit('warehouse-transform.received', {
        transformId: wareHouseTransform._id, toWarehouseName: toWarehouse.name ,
        fromWarehouseName : fromWarehouse.name,actorId: user._id
      });
      return `Warehouse transform proccess received success`
    } catch (error : any) {
      await session.abortTransaction();
      throw new BadRequestException(error.message);
    }finally{
      await session.endSession()
    }
  }

  async remove(wareHouseTransfornId: Types.ObjectId , user : HUserDocument):Promise<string> {
    const wareHouseTransform = await this.wareHouseTransformRepository.findOneAndDelete({filter : {_id : wareHouseTransfornId , status : SharedStatusEnum.PENDING}})
    if(!wareHouseTransform) throw new NotFoundException("Fail to delete wareHouse transform")
    this.eventEmitter.emit('audit-log.create', {
      actorId : user._id,
      action: LogActionEnum.WAREHOUSE_TRANSFORM_REMOVE,
      referenceId: wareHouseTransfornId,
      referenceModel: ReferenceModelEnum.TRANSFER,
      metadata: { deletedAt: new Date() }
    });
    this.eventEmitter.emit('warehouse-transform.removed', {
      transformId: wareHouseTransform._id,
      actorId: user._id,
    });
    return `Warehouse transform deleted success`
  }
}
