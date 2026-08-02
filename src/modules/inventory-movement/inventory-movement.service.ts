import { InventoryMovementRepository } from './../../DB/Repository/inventory_movement.repository';
import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { IInventoryMovement, IPagination } from 'src/common/interface';
import { GetAllInvMovementDTO } from './dto';
import { InventoryMovementSortEnum, SortEnum } from 'src/common/enum';

@Injectable()
export class InventoryMovementService {
  constructor(private readonly inventoryMovementRepository : InventoryMovementRepository){}
  
  async findAll(query : GetAllInvMovementDTO  ):Promise<IPagination<IInventoryMovement>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search , type } = query || {};
    const sortOption = InventoryMovementSortEnum[sort] || InventoryMovementSortEnum[SortEnum.NEWEST]
    const InventoryMovement = await this.inventoryMovementRepository.paginate({filter : {
      ...(search ? {$or : [
      {productTitleSnapshot : new RegExp(search , 'i')},
      {skuSnapshot : new RegExp(search , 'i')},
      {wareHouseSnapshot : new RegExp(search , 'i')},
      {type},
      ]} : {}),
    } , 
      limit , page , sort : sortOption})
    return InventoryMovement;
  }

  async findOne(inventoryMovementId: Types.ObjectId) : Promise<IInventoryMovement> {
    const invMovement = await this.inventoryMovementRepository.findOne({filter : {_id : inventoryMovementId} , options : {populate : [{path : "referenceId"} , {path : "wareHouseId" , select : "manager code slug" , populate : [{path : "manager" ,  select : "firstName lastName slug profileImage role"}]} , {path : "productVariantId"}]}})
    if (!invMovement) {
      throw new NotFoundException("Inventory movement not found")
    }
    return invMovement
  }

}
