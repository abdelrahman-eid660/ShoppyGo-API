/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
/* eslint-disable @typescript-eslint/no-base-to-string */
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { HUserDocument } from 'src/DB/models';
import {  Types } from 'mongoose';
import { WareHouseRepository , ProductVariantRepository , FinancialReviewRepository , SettingsRepository, PurchaseProductsRepository , InventoryRepository , ProductSupplierRepository  , SupplierRepository, InventoryMovementRepository } from 'src/DB/Repository';
import {IFinancialReview, IInventoryMovement, IPagination, IPurchaseItems, IPurchaseProducts } from 'src/common/interface';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { PurchaseProductSortEnum, SortEnum, PurchaseProcessStatusEnum, ReferenceModelEnum, InventoryMovementType, LogActionEnum, FinancialCategoryEnum, FinancialSourceEnum } from 'src/common/enum';
import { AllPurchaseProcess , CreatePurchaseProductDto , PruchaseItemsDTO , ReceivedDTO, UpdatePurchaseProductDto } from './dto';
import { DatabaseService } from 'src/DB/service/database.service';
import { AdjustStockService, InventoryMovementService } from 'src/common/service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { convertAmountToBaseCurrency } from 'src/common/utils/convert-currency';

@Injectable()
export class PurchaseProductsService {
    constructor(
      private readonly supplierRepository : SupplierRepository,
      private readonly purchaseProductsRepository : PurchaseProductsRepository,
      private readonly productSupplierRepository : ProductSupplierRepository,
      private readonly inventoryRepository : InventoryRepository,
      private readonly dataBaseService : DatabaseService,   
      private readonly inventoryMovementService : InventoryMovementService,  
      private readonly inventoryMovementRepository : InventoryMovementRepository,  
      private readonly wareHouseRepository : WareHouseRepository,
      private readonly financialReviewRepository : FinancialReviewRepository,
      private readonly settingsRepository : SettingsRepository,
      private readonly eventEmitter: EventEmitter2,  
      private readonly productVariantRepository: ProductVariantRepository,  
      private readonly adjustStockService: AdjustStockService,  
    ){}
  private async preparePurchaseItems( supplierId: Types.ObjectId,items: PruchaseItemsDTO[]): Promise<{purchaseItems: IPurchaseItems[] , totalCost: number}> {
    const ids = items.map(item => TransformToObjectId(item.productVariantId as unknown as string))
    const supplierProducts = await this.productSupplierRepository.find({filter : {supplierId , productVariantId : {$in : ids} , isActive : true}})
    if (supplierProducts.length !== ids.length) {
      throw new BadRequestException("Supplier does not supply one or more variants");
    }
    const supplierProductsMap = new Map(supplierProducts.map(product => [product.productVariantId.toString() , product]))
    const settings = await this.settingsRepository.findOne({ filter: {}});
    if (!settings) throw new NotFoundException(`System settings not found`);
    const baseCurrency = settings.baseCurrency;
    let totalCost : number = 0
    const purchaseItems = items.map(item => {
      const supplier = supplierProductsMap.get(item.productVariantId.toString())
      if (!supplier) {
        throw new BadRequestException("Invalid supplier variant mapping");   
      }
      if (supplier.minOrderQuantity! > item.orderedQuantity) {
        throw new BadRequestException(`${supplier.variantTitleSnapshot} minimum quantity is ${supplier.minOrderQuantity}`);
      }
      const costPrice = supplier.costPrice;
      const currencySnapshot = supplier.currency;
      let totalItemInBaseCurrency = item.orderedQuantity * costPrice;
      if (baseCurrency !== currencySnapshot) {
        const rate = settings.currencies.find(c => c.code === currencySnapshot)
        if(!rate || rate.exchangeRate <= 0) throw new NotFoundException(`System does not support exchange rate for currency: ${currencySnapshot}`)
        totalItemInBaseCurrency = totalItemInBaseCurrency / rate.exchangeRate
      }
      totalCost += totalItemInBaseCurrency
      return {...item , currencySnapshot , remainingQuantity : item.orderedQuantity , receivedQuantity : 0 , skuSnapshot :  supplier.variantTitleSnapshot as string, productVariantId : TransformToObjectId(item.productVariantId as unknown as string) , costPrice}
    })
    totalCost = Number(totalCost.toFixed(2))
    return {purchaseItems , totalCost}
  }
  async create({items , wareHouseId , expectedAt , supplierId}: CreatePurchaseProductDto , user : HUserDocument) : Promise<IPurchaseProducts> {
    supplierId = TransformToObjectId(supplierId as unknown as string)
    const supplier = await this.supplierRepository.findOne({filter : {_id :supplierId , isActive : true }})
    if (!supplier) {
      throw new NotFoundException("Supplier not found or not active")
    }
    const warehouse = await this.wareHouseRepository.findOne({filter : {_id :wareHouseId , isActive : true }})
    if (!warehouse) {
      throw new NotFoundException("warehouse not found or not active")
    }
    const {purchaseItems , totalCost } = await this.preparePurchaseItems(supplierId , items as PruchaseItemsDTO[] )
    const purchaseProduct = await this.purchaseProductsRepository.create({data : {items : purchaseItems , wareHouseId , supplierNameSnapshot : supplier.name , status : PurchaseProcessStatusEnum.PENDING , expectedAt , totalCost , createdBy : user._id , supplierId}})
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.PURCHASE_PRODUCTS_CREATE,
      referenceId: purchaseProduct._id,
      referenceModel: ReferenceModelEnum.PURCHASE_PRODUCTS,
      metadata: {
        supplierName: supplier.name,
        totalCost,
        itemsCount: purchaseItems.length
      }
    });
    this.eventEmitter.emit('purchase.created', {
      purchaseProductId: purchaseProduct._id,
      supplierNameSnapshot: supplier.name,
      createdBy: user._id,
      totalCost,
    });
    return purchaseProduct
  }
  async confirmProcess(purchaseProductId: Types.ObjectId, user: HUserDocument): Promise<IPurchaseProducts> {
    const session = await this.dataBaseService.startSession();
    try {
      session.startTransaction();
      const purchaseProductsExists = await this.purchaseProductsRepository.findOne({filter: { _id: purchaseProductId, status: PurchaseProcessStatusEnum.PENDING }, options: { session }});
      if (!purchaseProductsExists) {
        throw new NotFoundException("Purchase process not found or already processed");
      }
      const settings = await this.settingsRepository.findOne({ filter: {}, options: { session } });
      if (!settings) throw new NotFoundException(`System settings not found`);
      let totalCost : number = 0
      for (const item of purchaseProductsExists.items) {
        const unitCostInBase = convertAmountToBaseCurrency(item.costPrice , item.currencySnapshot , settings)
        totalCost += unitCostInBase * item.orderedQuantity
      }
      totalCost = Number(totalCost.toFixed(2))
      const confirmProcess = await this.purchaseProductsRepository.findOneAndUpdate({
        filter: { _id: purchaseProductId, status: PurchaseProcessStatusEnum.PENDING },
        update: { status: PurchaseProcessStatusEnum.ORDERED , totalCost }, options: { session , returnDocument : "after" }});
      if (!confirmProcess) {
        throw new NotFoundException("Fail to confirm this process");
      }
      await session.commitTransaction();
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id, action: LogActionEnum.PURCHASE_PRODUCTS_CONFIRM,
        referenceId: purchaseProductId, referenceModel: ReferenceModelEnum.PURCHASE_PRODUCTS,
        metadata: {
          status: PurchaseProcessStatusEnum.ORDERED,
          supplierName: confirmProcess.supplierNameSnapshot,
          totalCost,
          currency: settings.baseCurrency
        }
      });
      this.eventEmitter.emit('purchase.confirmed', {
        purchaseProductId: confirmProcess._id,
        supplierNameSnapshot: confirmProcess.supplierNameSnapshot,
        confirmedBy: user._id,
        totalCost,
      });
      return confirmProcess;
    } catch (error: any) {
      await session.abortTransaction();
      throw new BadRequestException(error.message);
    } finally {
      await session.endSession();
    }
  }
  async cancelProcess(purchaseProductId : Types.ObjectId , user : HUserDocument): Promise<IPurchaseProducts> {
    const cancelProcess = await this.purchaseProductsRepository.findOneAndUpdate({filter : {_id : purchaseProductId , status : PurchaseProcessStatusEnum.PENDING} , update : {status : PurchaseProcessStatusEnum.CANCELLED},options : {returnDocument : "after"}})
    if (!cancelProcess) {
      throw new NotFoundException("Purchase proccess not found or cancelled")
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,
      action: LogActionEnum.PURCHASE_PRODUCTS_CANCEL,
      referenceId: purchaseProductId,
      referenceModel: ReferenceModelEnum.PURCHASE_PRODUCTS,
      metadata: { status: PurchaseProcessStatusEnum.CANCELLED }
    });
    this.eventEmitter.emit('purchase.cancelled', {
      purchaseProductId: cancelProcess._id,
      supplierNameSnapshot: cancelProcess.supplierNameSnapshot,
      cancelledBy: user._id,
    });
    return cancelProcess
  }
  async receivedPurchaseProducts(purchaseProductId: Types.ObjectId , user :HUserDocument , {items} : ReceivedDTO): Promise<IPurchaseProducts> {
    const session = await this.dataBaseService.startSession()
    try {
      session.startTransaction()
      const purchaseProcess = await this.purchaseProductsRepository.findOne({
        filter : {
          _id : purchaseProductId , 
          status : {$in : [PurchaseProcessStatusEnum.ORDERED , PurchaseProcessStatusEnum.PARTIALLY_RECEIVED]}},options : {session , lean : true}})
      if (!purchaseProcess) {
        throw new NotFoundException( "Purchase process not found or already received.");
      }
      const warehouse = await this.wareHouseRepository.findOne({filter : {_id  : purchaseProcess.wareHouseId as Types.ObjectId , isActive : true} , options : {session}})
      if (!warehouse) {
        throw new NotFoundException("Warehouse not found")
      }
      const settings = await this.settingsRepository.findOne({filter: {},options: { session }});
      if (!settings) throw new NotFoundException('System settings not found');
      const purchaseMap = new Map(purchaseProcess.items.map(item=>[item.productVariantId.toString(),item]));
      const receivedMap = new Map(items.map(item => [item.productVariantId.toString(), item]));
      for (const receivedItem of items) {
        const variant = receivedItem.productVariantId.toString();
        if (!purchaseMap.has(variant)) {
          throw new BadRequestException(`Product variant ${variant} is not part of this purchase order.`);
        }
      }

      const updateditems: IPurchaseItems[] = [];
      const updatedVariants: any[] = [];
      const receivedItems = []
      let actualReceivedCost : number = 0
      let isAllReceived: boolean = true;
      for (const purchaseItem of purchaseProcess.items) {
        const variantIdStr = purchaseItem.productVariantId.toString();
        const currentReceivedItem = receivedMap.get(variantIdStr);
        if (currentReceivedItem) {
          if (currentReceivedItem.receivedQuantity > purchaseItem.remainingQuantity) {
            throw new BadRequestException(`Received quantity for variant ${variantIdStr} exceeds remaining quantity.`);
          }
          const costInBaseCurrency = convertAmountToBaseCurrency(purchaseItem.costPrice,purchaseItem.currencySnapshot,settings);
          actualReceivedCost += costInBaseCurrency * currentReceivedItem.receivedQuantity
          const newRemainingQuantity = purchaseItem.remainingQuantity - currentReceivedItem.receivedQuantity;
          const totalReceivedQuantity = (purchaseItem.receivedQuantity || 0) + currentReceivedItem.receivedQuantity;
          updateditems.push({...purchaseItem,receivedQuantity: totalReceivedQuantity,remainingQuantity: newRemainingQuantity});
          updatedVariants.push(this.adjustStockService.adjustStock({
            productVariantId : purchaseItem.productVariantId as Types.ObjectId , 
            quantityChange : currentReceivedItem.receivedQuantity,type : 'inc'
          }))
          if (newRemainingQuantity > 0) {
            isAllReceived = false;
          }
          receivedItems.push({...currentReceivedItem , costPriceInBaseCurrency : costInBaseCurrency})
        } else {
          updateditems.push(purchaseItem);
          if (purchaseItem.remainingQuantity > 0) {
            isAllReceived = false;
          }
        }
      }
      if (receivedItems.length) {
        const inventoryUpdates = receivedItems.map(item => {
         return this.inventoryMovementService.buildInventoryUpdateUpsert(
          item , purchaseMap.get(item.productVariantId.toString())?.skuSnapshot as string ,
          user , warehouse._id , item.costPriceInBaseCurrency
        )
        })
        await this.inventoryRepository.bulkWrite(inventoryUpdates , {session , ordered : true})
        await this.productVariantRepository.bulkWrite(updatedVariants , {session , ordered : true})
      }
      const inventoryMap = await this.inventoryMovementService.getInventoryMap({warehouseId : warehouse._id , items , session , type : 'receive'})
      const movements: Partial<IInventoryMovement>[] = [];
      for (const item of items) {
        const inventory =  inventoryMap.get(item.productVariantId.toString());
        if (!inventory) {
          throw new NotFoundException("Inventory not found");
        }
        const beforeQuantity = inventory.quantity-item.receivedQuantity
        const afterQuantity = inventory.quantity
        movements.push(this.inventoryMovementService.buildInventoryMovementPurchase({
          inventory , warehouse , item , beforeQuantity , afterQuantity , createdBy : user._id,
          referenceId : purchaseProcess._id , referenceModel : ReferenceModelEnum.PURCHASE_PRODUCTS , type : InventoryMovementType.PURCHASE
         }))
      }
      await this.inventoryMovementRepository.create({data : movements , options : {ordered : true , session}})
      const updateStatus = isAllReceived ? PurchaseProcessStatusEnum.RECEIVED : PurchaseProcessStatusEnum.PARTIALLY_RECEIVED;
      const updatedPurchase = await this.purchaseProductsRepository.findOneAndUpdate({
        filter : {_id : purchaseProductId , 
          status : {$in : [PurchaseProcessStatusEnum.ORDERED , PurchaseProcessStatusEnum.PARTIALLY_RECEIVED]}} , 
          update : {
            status : updateStatus , receivedAt : isAllReceived ? new Date() : undefined ,
            updatedBy : user._id , items : updateditems
          },options : {returnDocument : "after" ,  session}
        })
      if (!updatedPurchase) throw new NotFoundException("Purchase process not found");
      let financialReview : IFinancialReview
      if (actualReceivedCost > 0) {
       financialReview = await this.financialReviewRepository.createOne({
          data: {
            amount: Number(actualReceivedCost.toFixed(2)),category: FinancialCategoryEnum.EXPENSE,
            currency: settings.baseCurrency,createdBy: user._id,isSystem: false,
            referenceId: updatedPurchase._id,referenceModel: ReferenceModelEnum.PURCHASE_PRODUCTS,
            source: FinancialSourceEnum.PURCHASE,warehouseId: warehouse._id,
            notes: `Goods received for PO: ${updatedPurchase._id.toString()}. Received items count: ${items.length}`,
          },options: { session },
        });
        if (!financialReview) {
          throw new BadRequestException(`Fail to create financial review`)
        }
        this.eventEmitter.emit('financial.review.created', {
          financialReviewId: financialReview._id, category: FinancialCategoryEnum.EXPENSE,
          source: FinancialSourceEnum.PURCHASE, amount: Number(actualReceivedCost.toFixed(2)),
          currency: settings.baseCurrency, referenceId: updatedPurchase._id,
          referenceModel: ReferenceModelEnum.PURCHASE_PRODUCTS,warehouseId: warehouse._id,actorId: user._id,
        });
      }
      await session.commitTransaction()
      this.eventEmitter.emit('audit-log.create', {
        actorId: user._id,
        action: LogActionEnum.PURCHASE_PRODUCTS_RECEIVED,
        referenceId: purchaseProductId,
        referenceModel: ReferenceModelEnum.PURCHASE_PRODUCTS,
        metadata: {
          type: updateStatus,
          warehouseId: warehouse._id,
          receivedItemsCount: items.length
        }
      });

      this.eventEmitter.emit('inventory.stock_changed', {
        warehouseId: warehouse._id,
        receivedItemsCount: items.length,
        items: receivedItems,
      });
      
      this.eventEmitter.emit('purchase.received', {
        purchaseProductId: updatedPurchase._id,
        status: updateStatus,receivedBy: user._id,
        supplierNameSnapshot: updatedPurchase.supplierNameSnapshot,
        items: receivedItems, 
      });
      return updatedPurchase
    } catch (error : any) {
      await session.abortTransaction();
      throw new BadRequestException(error.message);
    }finally{
      await session.endSession()
    }
  }
  async update(purchaseProductId: Types.ObjectId, {items}: UpdatePurchaseProductDto , user : HUserDocument): Promise<IPurchaseProducts | undefined> {
    const purchaseExist = await this.purchaseProductsRepository.findOne({filter : {_id : purchaseProductId , status : PurchaseProcessStatusEnum.PENDING}})
    if (!purchaseExist) {
      throw new NotFoundException("Purchase processor not found or cancelled")
    }
    if (!items?.length) return
    const {purchaseItems , totalCost} = await this.preparePurchaseItems(purchaseExist.supplierId as Types.ObjectId , items as PruchaseItemsDTO[])
    const purchaseUpdate = await this.purchaseProductsRepository.findOneAndUpdate({filter : {_id : purchaseProductId , status : PurchaseProcessStatusEnum.PENDING} , update : {$set : {items : purchaseItems , totalCost , updatedBy : user._id}}})
    if (!purchaseUpdate) {
      throw new BadRequestException("Fail to update this process")
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.PURCHASE_PRODUCTS_UPDATE,
      referenceId: purchaseProductId,referenceModel: ReferenceModelEnum.PURCHASE_PRODUCTS,
      metadata: {
        oldTotalCost: purchaseExist.totalCost,newTotalCost: totalCost,itemsCount: purchaseItems.length
      }
    });
    this.eventEmitter.emit('purchase.updated', {
      purchaseProductId: purchaseUpdate._id,
      supplierNameSnapshot: purchaseExist.supplierNameSnapshot,
      updatedBy: user._id,totalCost,
    });
    return purchaseUpdate
  }
  async remove(purchaseProductId: Types.ObjectId , user : HUserDocument) : Promise<string> {
    const purchaseProcess = await this.purchaseProductsRepository.findOneAndDelete({filter : {_id : purchaseProductId , status : {$ne : PurchaseProcessStatusEnum.ORDERED}}})
    if (!purchaseProcess) {
      throw new NotFoundException("Purchase proccess not found or its ordered")
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,action: LogActionEnum.PURCHASE_PRODUCTS_REMOVE,
      referenceId: purchaseProductId,referenceModel: ReferenceModelEnum.PURCHASE_PRODUCTS,
      metadata: {supplierName: purchaseProcess.supplierNameSnapshot,deletedTotalCost: purchaseProcess.totalCost}
    });
    this.eventEmitter.emit('purchase.removed', {
      purchaseProductId,supplierNameSnapshot: purchaseProcess.supplierNameSnapshot,
      deletedTotalCost: purchaseProcess.totalCost,actorId: user._id,
    });
    return `Purchases process deleted successfuly`
  }
  async findAll(query : AllPurchaseProcess) : Promise<IPagination<IPurchaseProducts>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search , status } = query || {};
    const sortOption = PurchaseProductSortEnum[sort] || PurchaseProductSortEnum[SortEnum.NEWEST]
    const purchasesProcess = await this.purchaseProductsRepository.paginate({
      filter : {...(search) && {supplierNameSnapshot : new RegExp(search , 'i')}, ...(status) && {status}},
      limit , page , sort : sortOption
    })
    return purchasesProcess
  }
  async findOne(purchaseProductId: Types.ObjectId): Promise<IPurchaseProducts> {
    const purchaseProcess = await this.purchaseProductsRepository.findOne({filter : {_id : purchaseProductId} , options : {populate : [{path : "supplierId"},{path : "createdBy" , select : "firsName lastName profileImage role "}]} })
    if (!purchaseProcess) {
      throw new NotFoundException("Purchase proccess not found")
    }
    return purchaseProcess
  }
}
