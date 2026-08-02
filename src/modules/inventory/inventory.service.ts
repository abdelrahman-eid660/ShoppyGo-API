import { InventoryRepository ,  WareHouseRepository , ProductVariantRepository} from './../../DB/Repository';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateInventoryDto } from './dto/create-inventory.dto';
import { UpdateInventoryDto } from './dto/update-inventory.dto';
import type{ HInventoryDocument, HUserDocument } from 'src/DB/models';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { Types } from 'mongoose';
import { PaginationDTO } from 'src/common/dto';
import { InventorySortEnum, LogActionEnum, ReferenceModelEnum, SortEnum } from 'src/common/enum';
import { IInventory, IPagination, IProduct } from 'src/common/interface';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class InventoryService {
  constructor(
    private readonly inventoryRepository : InventoryRepository , 
    private readonly productVariantRepository : ProductVariantRepository,
    private readonly wareHouseRepository : WareHouseRepository,
    private readonly eventEmitter : EventEmitter2
  ){}
  async create(data: CreateInventoryDto , user : HUserDocument):Promise<IInventory> {
    const productVariantId = TransformToObjectId(data.productVariantId as unknown as string)
    const wareHouseId = TransformToObjectId(data.wareHouseId as unknown as string)
    const variantExist = await this.productVariantRepository.findOne({filter : {_id : productVariantId} , options : {populate : [{path : "productId" , select : "title"}]}})
    if (!variantExist) {
      throw new NotFoundException("This variant does not exist");
    }
    const wareHouseExist = await this.wareHouseRepository.findOne({filter : {_id : wareHouseId , isActive : true}})
    if (!wareHouseExist) {
      throw new NotFoundException("This warehouse does not exist");
    }
    const product = variantExist.productId as IProduct;
    const inventoryExists = await this.inventoryRepository.findOne({filter: { productVariantId , wareHouseId }});
    if (inventoryExists) {
      throw new BadRequestException("Inventory already exists for this variant");
    }
    const inventory = await this.inventoryRepository.create({data : {...data , governorateWarehouseSnapshot : wareHouseExist.address.governorate , availableQuantity : data.quantity  , wareHouseId , productVariantId , createdBy  : user._id , skuSnapshot : variantExist.sku , productTitleSnapshot : product.title}})
    if (!inventory) {
      throw new BadRequestException(`Fail to add ${variantExist?.sku} to inventory`)
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,referenceId: inventory._id,
      action: LogActionEnum.INVENTORY_ITEM_CREATE,referenceModel: ReferenceModelEnum.INVENTORY,
      metadata: {
        sku: variantExist.sku,warehouseName: wareHouseExist.name || wareHouseId,
        initialQuantity: data.quantity,lowStockThreshold: data.lowStockThreshold
      }
    });
    this.eventEmitter.emit('inventory.created', {
      inventoryId: inventory._id,sku: variantExist.sku,
      productTitle: product.title, warehouseName: wareHouseExist.name || wareHouseId,
      quantity: data.quantity,lowStockThreshold: data.lowStockThreshold,actorId: user._id,
    });
    return inventory;
  }

  async findAll(query  : PaginationDTO):Promise<IPagination<IInventory>> {
    const { page = 1 , limit = 4 , sort = SortEnum.TITLE_DESC , search} = query || {};
    const sortOption = InventorySortEnum[sort] || InventorySortEnum[SortEnum.TITLE_DESC]
    const Inventory = await this.inventoryRepository.paginate({filter : {
      ...(search ? {$or : [
      {productTitleSnapshot : new RegExp(search , 'i')},
      {skuSnapshot : new RegExp(search , 'i')},
      ]} : {}),
    } , 
      limit , page , sort : sortOption})
    return Inventory;
  }

  async update(inventoryId: Types.ObjectId, data: UpdateInventoryDto , user : HUserDocument):Promise<IInventory> {
    const update : Partial<HInventoryDocument> = { updatedBy : user._id}
    const inventoryExist = await this.inventoryRepository.findOne({filter : {_id : inventoryId}})
    if (!inventoryExist) {
      throw new NotFoundException("Inventory not found")
    }
    if(data.wareHouseId !== undefined){
      const wareHouseId = TransformToObjectId(data.wareHouseId as unknown as string)
      const warehouse = await this.wareHouseRepository.findOne({filter : {_id : wareHouseId}})
      if (!warehouse) {
        throw new NotFoundException("Warehouse not found")
      }
      update.wareHouseId = data.wareHouseId
      update.governorateWarehouseSnapshot = warehouse.address.governorate
    }
    if (data.quantity !== undefined && data.lowStockThreshold !== undefined && data?.quantity < data?.lowStockThreshold) {
      update.lowStockThreshold = data.lowStockThreshold
      throw new BadRequestException("Quantity cannot be less than low stock threshold");
    }
    let availableQuantity;
    if (data.quantity !== undefined) {
      availableQuantity = data.quantity - inventoryExist?.reserved
      update.availableQuantity = availableQuantity
      update.quantity = data.quantity
    }
    const inventory = await this.inventoryRepository.findOneAndUpdate({filter: { _id : inventoryId } , update : {$set : {...update}}});
    if (!inventory) {
      throw new BadRequestException("Fail to set new updates");
    }
    this.eventEmitter.emit('audit-log.create', {
      actorId: user._id,referenceId: inventory._id,
      action: LogActionEnum.INVENTORY_ITEM_UPDATE,referenceModel: ReferenceModelEnum.INVENTORY,
      metadata: {
        sku: inventoryExist.skuSnapshot,
        oldQuantity: inventoryExist.quantity,
        newQuantity: data.quantity !== undefined ? data.quantity : inventoryExist.quantity,
        oldAvailable: inventoryExist.availableQuantity,
        newAvailable: update.availableQuantity !== undefined ? update.availableQuantity : inventoryExist.availableQuantity,
        changedFields: Object.keys(data)
      }
    });
    this.eventEmitter.emit('inventory.updated', {
      inventoryId: inventory._id,sku: inventoryExist.skuSnapshot,
      actorId: user._id,productTitle: inventoryExist.productTitleSnapshot,
      oldQuantity: inventoryExist.quantity,newQuantity: inventory.quantity,
      availableQuantity: inventory.availableQuantity,
    });
    if (inventory.availableQuantity <= inventory.lowStockThreshold) {
      this.eventEmitter.emit('inventory.low_stock', {
        inventoryId: inventory._id,sku: inventory.skuSnapshot,
        productTitle: inventory.productTitleSnapshot,availableQuantity: inventory.availableQuantity,
        lowStockThreshold: inventory.lowStockThreshold,warehouseId: inventory.wareHouseId,
      });
    }
    return inventory;
  }

  async remove(inventoryId: Types.ObjectId , user : HUserDocument):Promise<string> {
    const inventory = await this.inventoryRepository.findOneAndDelete({filter : {_id : inventoryId} , options : {returnDocument : "before"}})
    if (!inventory) {
      throw new BadRequestException("Fail to remove this variant from inventory")
    }
    this.eventEmitter.emit('audit-log.create', {
      action: LogActionEnum.INVENTORY_ITEM_REMOVE,actorId : user._id,referenceId: inventoryId,
      referenceModel: ReferenceModelEnum.INVENTORY,
      metadata: {
        skuSnapshot: inventory.skuSnapshot,lastQuantityBeforeDelete: inventory.quantity,
        warehouseId: inventory.wareHouseId
      }
    });
    this.eventEmitter.emit('inventory.removed', {
      inventoryId: inventoryId,sku: inventory.skuSnapshot,
      productTitle: inventory.productTitleSnapshot,actorId: user._id,
    });
    return `${inventory.skuSnapshot} removed successfuly`
  }
}
