/* eslint-disable @typescript-eslint/no-base-to-string */
import {InventoryMovementRepository , StockAdjustmentRepository ,WareHouseRepository,InventoryRepository, FinancialReviewRepository, SettingsRepository, ProductVariantRepository  } from './../../DB/Repository';
import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { HUserDocument } from 'src/DB/models';
import { CreateStockAdjustmentDto, GetAllStocksDTO, UpdateStockAdjustmentDto } from './dto';
import { AdjustStockService, InventoryMovementService } from 'src/common/service';
import { IPagination, IStockAdjustment, IStockAdjustmentItems } from 'src/common/interface';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { FinancialCategoryEnum, FinancialSourceEnum, InventoryMovementType, LogActionEnum, ReferenceModelEnum, SharedStatusEnum, SortEnum, StockAdjustmenSortEnum, StockStatusEnum } from 'src/common/enum';
import { DatabaseService } from 'src/DB/service/database.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StockAdjustmentService {
  constructor(
    private readonly wareHouseRepository : WareHouseRepository,
    private readonly inventoryRepository : InventoryRepository,
    private readonly inventoryMovementRepository : InventoryMovementRepository,
    private readonly stockAdjustmentRepository : StockAdjustmentRepository,
    private readonly inventoryMovementService : InventoryMovementService,
    private readonly financialReviewRepository : FinancialReviewRepository,
    private readonly settingsRepository : SettingsRepository,
    private readonly databaseService : DatabaseService,
    private readonly eventEmitter : EventEmitter2,
    private readonly adjustStockService: AdjustStockService,  
    private readonly productVariantRepository: ProductVariantRepository,  

  ){}
  async create({items , warehouseId , notes}: CreateStockAdjustmentDto , user : HUserDocument):Promise<IStockAdjustment> {
    const ids = items.map(item=> TransformToObjectId(item.productVariantId as unknown as string))
    const wareHouseExist = await this.wareHouseRepository.findOne({filter : {_id : TransformToObjectId(warehouseId as unknown as string) , isActive : true}})
    if (!wareHouseExist) {
      throw new NotFoundException("Warehouse not found")
    }
    const stockExist = await this.stockAdjustmentRepository.findOne({filter : {"items.productVariantId" : {$in : ids} , warehouseId : TransformToObjectId(warehouseId as unknown as string) , status : SharedStatusEnum.PENDING}})
    if (stockExist) {
      throw new ConflictException("Stock adjustment already exist")
    }
    const inventoryMap = await this.inventoryMovementService.getInventoryMap<IStockAdjustmentItems>({warehouseId : TransformToObjectId(warehouseId as unknown as string) , items})
    const stockItems = []
    for (const item of items) {
      const productExist = inventoryMap.get(item.productVariantId.toString())
      if (!productExist) {
        throw new NotFoundException("Product variant not found")
      }
      const expectedQuantity = productExist.quantity
      const difference = item.countedQuantity - expectedQuantity
      const stockStatus = difference < 0 ? StockStatusEnum.Inventory_shortage : difference == 0 ? StockStatusEnum.BALANCED : StockStatusEnum.Inventory_overage
      stockItems.push({...item , productVariantId : TransformToObjectId(item.productVariantId as unknown as string) ,expectedQuantity , difference , skuSnapshot : productExist.skuSnapshot , stockStatus })
    }
    const stockAdjustment = await this.stockAdjustmentRepository.create({data : {warehouseId : TransformToObjectId(warehouseId as unknown as string) , notes , warehouseNameSnapshot : wareHouseExist.name , items : stockItems , createdBy : user._id , status : SharedStatusEnum.PENDING }})
    if (!stockAdjustment) {
      throw new BadRequestException("Fail to create stock adjustment")
    }
    this.eventEmitter.emit('audit-log.create',{
      actorId : user._id,isSystem : false,
      action : LogActionEnum.STOCK_ADJUSTMENT_CREATE,
      referenceId: stockAdjustment._id,referenceModel : ReferenceModelEnum.STOCK_ADJUSTMENT,
      metadata : {
        warehouseId : stockAdjustment.warehouseId,warehouseName : stockAdjustment.warehouseNameSnapshot,
        itemsCount : stockAdjustment.items.length,notes : stockAdjustment.notes
      }
    })
    this.eventEmitter.emit('stock.adjustment.created', {
      stockAdjustmentId: stockAdjustment._id,warehouseId: stockAdjustment.warehouseId,
      warehouseName: stockAdjustment.warehouseNameSnapshot,
      itemsCount: stockAdjustment.items.length,
      notes: stockAdjustment.notes,actorId: user._id,
    });
    return stockAdjustment
  }

  async findAll(query : GetAllStocksDTO) : Promise<IPagination<IStockAdjustment>> {
        const {limit = 4 , page , sort = SortEnum.NEWEST , search , reason , stockStatus , status} = query
        const sortOptions = StockAdjustmenSortEnum[sort] || StockAdjustmenSortEnum[SortEnum.NEWEST]
        const stockAdjustmen = await this.stockAdjustmentRepository.paginate({
        filter: {
          ...(search && {$or: [
            { "items.skuSnapshot": new RegExp(search, "i") },
            {warehouseNameSnapshot: new RegExp(search, "i") },
          ],
          }),
            ...(stockStatus && { "items.stockStatus" : stockStatus }),
            ...(reason && { "items.reason" : reason }),
            ...(status && { status }),
        },
        limit,page,sort: sortOptions,options: {
          populate: [
            {path: "createdBy", select: "firstName lastName profileImage role"},
            {path: "approvedBy", select: "firstName lastName profileImage role"},
            {path: "warehouseId",select: "name code"},
            {path: "items.productVariantId",select: "sku"},
          ],
        },
        });
        return stockAdjustmen
  }

  async findOne(stockAdjustmentId : Types.ObjectId) : Promise<IStockAdjustment> {
    const stockAdjustment = await this.stockAdjustmentRepository.findOne({filter : {_id : stockAdjustmentId} ,
       options : {populate : [ {path : "createdBy" , select : "firstName lastName role"} ,  {path : "approvedBy" , select : "firstName lastName role"} ,  {path : "warehouseId" , select : "code manager" , populate : [{path : "manager" , select : "firstName lastName role"}]} ,  {path : "items.productVariantId" , select : "sku "} ]}})
    if (!stockAdjustment) {
      throw new NotFoundException("Stock adjustment not found")
    }
    return stockAdjustment
  }

  async update(stockAdjustmentId : Types.ObjectId, {items , notes , warehouseId}: UpdateStockAdjustmentDto , user : HUserDocument):Promise<IStockAdjustment> {
    const stockExist = await this.stockAdjustmentRepository.findOne({filter : {_id : stockAdjustmentId , status : SharedStatusEnum.PENDING}})
    if (!stockExist) {
      throw new NotFoundException("Stock adjustment not found or already processed")
    }
    const update : any = {updatedBy : user._id}
    let targetWarehouseId = stockExist.warehouseId;
    if (warehouseId !== undefined) {
    const warehouse = TransformToObjectId(warehouseId as unknown as string);
    const wareHouseExist = await this.wareHouseRepository.findOne({
      filter: { _id: warehouse, isActive: true },
    });
    if (!wareHouseExist) {
      throw new NotFoundException('Warehouse not found');
    }
    targetWarehouseId = warehouse;
    update.warehouseId = warehouse;
    }
    if (items?.length) {
      const inventoryMap = await this.inventoryMovementService.getInventoryMap<IStockAdjustmentItems>({warehouseId : targetWarehouseId as Types.ObjectId , items})
      const stockItems = []
      for (const item of items) {
        const productExist = inventoryMap.get(item.productVariantId.toString())
        if (!productExist) {
          throw new NotFoundException("Product variant not found")
        }
        const expectedQuantity = productExist.availableQuantity
        const difference = item.countedQuantity - expectedQuantity
        let stockStatus: StockStatusEnum;
        if (difference > 0) {
          stockStatus = StockStatusEnum.Inventory_overage;
        } else if (difference < 0) {
          stockStatus = StockStatusEnum.Inventory_shortage;
        } else {
          stockStatus = StockStatusEnum.BALANCED;
        }
        stockItems.push({...item ,expectedQuantity , difference , skuSnapshot : productExist.skuSnapshot , stockStatus })
      }
      update.items = stockItems
    }
    const stockAdjustment = await this.stockAdjustmentRepository.findOneAndUpdate({filter : {_id : stockAdjustmentId, status : SharedStatusEnum.PENDING } , update : {$set : {...update , notes}}})
    if (!stockAdjustment) {
      throw new BadRequestException("Fail to update stock adjustment")
    }
    this.eventEmitter.emit('audit-log.create',{
      actorId : user._id,isSystem : false,
      action : LogActionEnum.STOCK_ADJUSTMENT_UPDATE,
      referenceId: stockAdjustment._id,
      referenceModel : ReferenceModelEnum.STOCK_ADJUSTMENT,
      metadata : {
        hasItemsChanged : !!items?.length,
        hasWarehouseChanged : warehouseId !== undefined,
        notes : stockAdjustment.notes
      }
    })
    this.eventEmitter.emit('stock.adjustment.updated', {
      stockAdjustmentId: stockAdjustment._id,warehouseId: stockAdjustment.warehouseId,
      warehouseName: stockAdjustment.warehouseNameSnapshot,hasItemsChanged: !!items?.length,
      hasWarehouseChanged: warehouseId !== undefined,actorId: user._id,
    });
    return stockAdjustment
  }

  async approve(stockAdjustmentId : Types.ObjectId , user : HUserDocument):Promise<{message : string}> {
    const session = await this.databaseService.startSession()
    try {
      session.startTransaction()
      const stockAdjustmentExist = await this.stockAdjustmentRepository.findOne({filter : {_id : stockAdjustmentId , status : SharedStatusEnum.PENDING}, options : {session}})
      if (!stockAdjustmentExist) {
        throw new NotFoundException("Stock adjustment not found or already proccessed")
      }
      const warehouse = await this.wareHouseRepository.findOne({filter : {_id : stockAdjustmentExist.warehouseId as Types.ObjectId , isActive : true}, options : {session}})
      if (!warehouse) {
        throw new NotFoundException("Warehouse not found")
      }
      const settings = await this.settingsRepository.findOne({filter: {},options: { session }});
      if (!settings) {
        throw new NotFoundException('Settings not found');
      }
      const inventoryMap = await this.inventoryMovementService.getInventoryMap({warehouseId : stockAdjustmentExist.warehouseId as Types.ObjectId , items : stockAdjustmentExist.items , session})
      
      const inventoryUpdates = []
      const inventoryMovementsUpdates = []
      const productVariantUpdates = [];
      const adjustmentsSummary = [];

      const baseCurrency = settings.baseCurrency;

      let totalLossAmount : number = 0
      let totalGainAmount : number = 0

      for (const item of stockAdjustmentExist.items) {
        const inventory = inventoryMap.get(item.productVariantId.toString())
        if (!inventory) {
          throw new NotFoundException(`Inventory record not found for variant: ${item.productVariantId.toString()}`)
        }
        inventoryUpdates.push(this.inventoryMovementService.buildInventoryUpdate(inventory , item.countedQuantity , user._id))
        inventoryMovementsUpdates.push(this.inventoryMovementService.buildInventoryMovementStockAdjustment({
          inventory , warehouse, item , 
          beforeQuantity : inventory.quantity , afterQuantity : item.countedQuantity , createdBy : user._id,
          referenceId : stockAdjustmentExist._id , referenceModel : ReferenceModelEnum.STOCK_ADJUSTMENT,
          type : InventoryMovementType.ADJUSTMENT
        }))
        adjustmentsSummary.push({ productVariantId: item.productVariantId, sku: item.skuSnapshot,
          expected: item.expectedQuantity, counted: item.countedQuantity, difference: item.difference,
          status: item.stockStatus
        });
        const itemCost = inventory.costPrice || 0
        if (item.difference < 0) {
          const diffQty = Math.abs(item.difference);
          totalLossAmount += diffQty * itemCost
          productVariantUpdates.push(this.adjustStockService.adjustStock({
            productVariantId : item.productVariantId as Types.ObjectId , quantityChange : diffQty , type : 'dec'
        } ))
        } else if (item.difference > 0){
            totalGainAmount += item.difference * itemCost
            productVariantUpdates.push(this.adjustStockService.adjustStock({
              productVariantId : item.productVariantId as Types.ObjectId , quantityChange : item.difference , type : 'inc'
            }))
          }
      }
      const updateInventory = await this.inventoryRepository.bulkWrite(inventoryUpdates , {session , ordered : true})
      if (!updateInventory) throw new BadRequestException("Failed to execute bulk inventory updates")
      const inventoryMovement = await this.inventoryMovementRepository.create({data : inventoryMovementsUpdates , options : {session , ordered : true}})
      if(!inventoryMovement) throw new BadRequestException("Fail to create inventory movement")
      const stockAdjustment = await this.stockAdjustmentRepository.findOneAndUpdate({filter : {_id : stockAdjustmentId , status : SharedStatusEnum.PENDING} , update : {updatedBy : user._id , status : SharedStatusEnum.APPROVED} , options : {session , returnDocument : "after"}})
      if (!stockAdjustment) {
        throw new NotFoundException("Stock adjustment not found")
      }
      if (totalLossAmount > 0) {
        const financialReview = await this.financialReviewRepository.createOne({data : {
          amount : Number(totalLossAmount.toFixed(2)) , referenceId : stockAdjustment._id ,
          referenceModel : ReferenceModelEnum.STOCK_ADJUSTMENT, category : FinancialCategoryEnum.LOSS , 
          isSystem : false,createdBy: user._id , currency : baseCurrency , source : FinancialSourceEnum.INVENTORY_AUDIT,
          warehouseId : warehouse._id , notes: `Losses came from ${stockAdjustmentId.toString()} in ${warehouse.name}` 
        },options : {session , ordered : true}})
        if(!financialReview)throw new BadRequestException(`Fail to create financial review for ${stockAdjustment.warehouseNameSnapshot}`)
        this.eventEmitter.emit('financial.review.created', {
          financialReviewId: financialReview._id, category: FinancialCategoryEnum.LOSS,
          source: FinancialSourceEnum.INVENTORY_AUDIT, amount: Number(totalLossAmount.toFixed(2)),
          currency: baseCurrency, referenceId: stockAdjustment._id,
          referenceModel: ReferenceModelEnum.STOCK_ADJUSTMENT,warehouseId: warehouse._id,actorId: user._id,
        });
      }
      if (totalGainAmount > 0) {
        const financialReview = await this.financialReviewRepository.createOne({data: {
          amount : totalGainAmount , referenceId : stockAdjustment._id , referenceModel : ReferenceModelEnum.STOCK_ADJUSTMENT,
          category : FinancialCategoryEnum.REVENUE , isSystem : false, createdBy: user._id ,warehouseId : warehouse._id,
          source : FinancialSourceEnum.INVENTORY_AUDIT,
          notes: `Revenue came from ${stockAdjustmentId.toString()} becouse surplus in ${warehouse.name}` , currency : baseCurrency
          },options : {session , ordered : true}
        })
        if(!financialReview)throw new BadRequestException(`Fail to create financial review for ${stockAdjustment.warehouseNameSnapshot}`)
        this.eventEmitter.emit('financial.review.created', {
          financialReviewId: financialReview._id,category: FinancialCategoryEnum.REVENUE,
          source: FinancialSourceEnum.INVENTORY_AUDIT,amount: totalGainAmount,
          currency: baseCurrency,referenceId: stockAdjustment._id,
          referenceModel: ReferenceModelEnum.STOCK_ADJUSTMENT,warehouseId: warehouse._id,actorId: user._id,
        });
      }
      if (productVariantUpdates.length > 0) {
        const updateProductVrainat = await this.productVariantRepository.bulkWrite(productVariantUpdates, { ordered: true, session: session });
        if(!updateProductVrainat) throw new BadRequestException("Fail to update inventory")
      }
      await session.commitTransaction()
      this.eventEmitter.emit('audit-log.create',{
        actorId : user._id,
        isSystem : false,
        action : LogActionEnum.STOCK_ADJUSTMENT_APPROVE,
        referenceId: stockAdjustment._id,
        referenceModel : ReferenceModelEnum.STOCK_ADJUSTMENT,
        metadata : {
          warehouseId : stockAdjustment.warehouseId,
          warehouseName : stockAdjustment.warehouseNameSnapshot,
          adjustments : adjustmentsSummary
        }
      })
      this.eventEmitter.emit('stock.adjustment.approved', {
        stockAdjustmentId: stockAdjustment._id,warehouseId: stockAdjustment.warehouseId,
        warehouseName: stockAdjustment.warehouseNameSnapshot,
        totalLossAmount: Number(totalLossAmount.toFixed(2)),totalGainAmount: Number(totalGainAmount.toFixed(2)),
        currency: baseCurrency,adjustmentsSummary,
        approvedBy: `${user.firstName} ${user.lastName}`,actorId: user._id,
      });
      
      return {message : `Stock adjustment approved successful by ${user.firstName} ${user.lastName}`}
    } catch (error : any) {
      await session.abortTransaction()
      throw new BadRequestException(error.message)
    }finally{
      await session.endSession()
    }
  }
  
  async reject(stockAdjustmentId : Types.ObjectId , user : HUserDocument):Promise<string> {
    const stockAdjustment = await this.stockAdjustmentRepository.findOneAndUpdate({filter : {_id : stockAdjustmentId , status : SharedStatusEnum.PENDING} , update : {updatedBy : user._id , status : SharedStatusEnum.REJECTED}})
    if (!stockAdjustment) {
      throw new NotFoundException("Stock adjustment not found")
    }
    this.eventEmitter.emit('audit-log.create',{
      actorId : user._id,isSystem : false,
      action : LogActionEnum.STOCK_ADJUSTMENT_REJECT,referenceId: stockAdjustment._id,
      referenceModel : ReferenceModelEnum.STOCK_ADJUSTMENT,
      metadata : {
        warehouseId : stockAdjustment.warehouseId,statusBefore : SharedStatusEnum.PENDING,
        statusAfter : SharedStatusEnum.REJECTED,
      }
    })
    this.eventEmitter.emit('stock.adjustment.rejected', {
      stockAdjustmentId: stockAdjustment._id, warehouseId: stockAdjustment.warehouseId,
      rejectedBy: `${user.firstName} ${user.lastName}`, actorId: user._id,
    });
    return `Stock adjustment rejected successful by ${user.firstName} ${user.lastName}`
  }

  async remove(stockAdjustmentId : Types.ObjectId , user : HUserDocument):Promise<string> {
    const stockAdjustment = await this.stockAdjustmentRepository.findOneAndDelete({filter : {_id : stockAdjustmentId} , options : {returnDocument : "before"}})
    if (!stockAdjustment) {
      throw new NotFoundException("Stock adjustment not found")
    }
    this.eventEmitter.emit('audit-log.create',{
      actorId : user._id,
      isSystem : false,
      action : LogActionEnum.STOCK_ADJUSTMENT_REMOVE,
      referenceId: stockAdjustment._id,
      referenceModel : ReferenceModelEnum.STOCK_ADJUSTMENT,
      metadata : {
        deletedDataSnapshot: {
          warehouseId: stockAdjustment.warehouseId,
          warehouseNameSnapshot: stockAdjustment.warehouseNameSnapshot,
          itemsCount: stockAdjustment.items?.length,
          statusAtDeletion: stockAdjustment.status,
          notes: stockAdjustment.notes
      }
      }
    })
    this.eventEmitter.emit('stock.adjustment.removed', {
      stockAdjustmentId: stockAdjustmentId,warehouseId: stockAdjustment.warehouseId,
      warehouseName: stockAdjustment.warehouseNameSnapshot, actorId: user._id,
    });
    return `Stock adjustment deleted successful`
  }
}
