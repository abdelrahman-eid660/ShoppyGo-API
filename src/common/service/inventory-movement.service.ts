import { InventoryRepository } from './../../DB/Repository';
/* eslint-disable @typescript-eslint/no-base-to-string */
import { Injectable, NotFoundException } from "@nestjs/common";
import { AnyBulkWriteOperation, ClientSession, Types } from "mongoose";
import { IInventory, IInventoryMovement, IOrderItem, IStockAdjustmentItems, IWareHouse, IWareHouseTransformItems } from "../interface";
import { TransformToObjectId } from "../utils/ObjectId";
import { InventoryMovementType, OperationEnum, ReferenceModelEnum } from '../enum';
import { HUserDocument } from 'src/DB/models';
import { ReceivedItemsDTO } from 'src/modules/purchase-products/dto';
export type InventoryMovemntReturn<T> = {
    inventory: IInventory; 
    warehouse: IWareHouse; 
    item: T;
    referenceModel: ReferenceModelEnum;
    beforeQuantity: number;
    afterQuantity: number;
    type: InventoryMovementType;
    referenceId: Types.ObjectId;
    createdBy: Types.ObjectId | null | undefined; // عدلها لتقبل undefined
    isSystemAction?: boolean; // 1. أضف هذا الحقل هنا
}

@Injectable()
export class InventoryMovementService {
    constructor(private readonly InventoryRepository : InventoryRepository){}

    async getInventoryMap<T extends { productVariantId: any }>({ warehouseId, items,session , type = 'approve'}:{ warehouseId: Types.ObjectId, items: T[],session?: ClientSession, type? : 'receive' | 'approve'}): Promise<Map<string, IInventory>> {
        const ids = items.map(item =>TransformToObjectId(item.productVariantId.toString()));
        const inventories = await this.InventoryRepository.find({filter: {wareHouseId : warehouseId,productVariantId: { $in: ids }},options: {session}});
        if (type !== 'receive') {
            if (inventories.length !== ids.length) {
                throw new NotFoundException('Some product variants are not found in inventory',);
            }            
        }
        const inventoryMap =  new Map(inventories.map(inv => [inv.productVariantId.toString(),inv]));
        return inventoryMap
    }

    buildInventoryTransformUpdate(inventory: IInventory,quantity: number,userId: Types.ObjectId,operation?: OperationEnum): AnyBulkWriteOperation {
        const filter: any = {_id: inventory._id};
        if (operation === OperationEnum.DECREASE) {
            filter.availableQuantity = { $gte: quantity };
        }
        const value = operation === OperationEnum.INCREAS ? quantity : -quantity;
        return {
            updateOne: { filter,
            update: {$inc: {quantity: value,availableQuantity: value},$set: {updatedBy: userId,lastStockUpdate: new Date()}}
            }
        };
    }

    buildInventoryUpdate(inventory: IInventory,quantity: number,userId: Types.ObjectId): AnyBulkWriteOperation {
        return {
            updateOne: { filter: {_id: inventory._id},
            update: {$set: {quantity,availableQuantity : quantity , updatedBy: userId,lastStockUpdate: new Date()}}
            }
        };
    }
    
    buildInventoryUpdateOrder({inventory, quantity, type = 'inc'} : {inventory: IInventory,quantity: number , type? : 'inc' | 'decr'}): AnyBulkWriteOperation {
        
        if (type === 'decr') {
            return {
                updateOne: { filter: {_id: inventory._id ,reserved: {$gte: quantity}},
                update: {$set: {lastStockUpdate: new Date()} , $inc : {availableQuantity : quantity  , reserved : -quantity}}
                }
            };
        }else{
            return {
                updateOne: { filter: {_id: inventory._id ,availableQuantity: {$gte: quantity}},
                update : {$set: {lastStockUpdate: new Date()} , $inc : {availableQuantity : -quantity  , reserved : quantity}}
                }
            }
        }
    }

    buildInventoryUpdateOrderStatus({inventory, quantity, type = 'confirm'} : {inventory: IInventory,quantity: number , type? : 'confirm' | 'cancel' | 'refund'}): AnyBulkWriteOperation {
        if (type === 'cancel') {
            return {
                updateOne: { filter: {_id: inventory._id},
                update: {$set: {lastStockUpdate: new Date()} , $inc : {availableQuantity : quantity  , reserved : -quantity}}
                }
            };
        }else if (type === 'confirm'){
            return {
                updateOne: { filter: {_id: inventory._id},
                update : {$set: {lastStockUpdate: new Date() }, $inc : {sold : quantity , reserved : -quantity , quantity : -quantity}}
                }
            }
        }else{
            return {
                updateOne: { filter: {_id: inventory._id},
                update : {$set: {lastStockUpdate: new Date() }, $inc : {sold : -quantity ,  availableQuantity : quantity , quantity : quantity}}
                }
            }
        }
    }

    buildInventoryUpdateUpsert(item : any , skuSnapshot :string , user : HUserDocument , wareHouseId : Types.ObjectId , costPrice : number): AnyBulkWriteOperation {
        const receivedQty = item.receivedQuantity
        const newUnitCost = costPrice
        return {
            updateOne: {
                filter: {
                wareHouseId,
                productVariantId: TransformToObjectId(item.productVariantId),
            },
                update : [
                    {
                        $set : {
                            qtyBefore : {$ifNull : ['$quantity' , 0]},
                            costBefore : {$ifNull : ['$costPrice' , newUnitCost]},

                            wareHouseId : {$ifNull : ["$wareHouseId" , wareHouseId]},
                            productVariantId : {
                                $ifNull : ['$productVariantId' , TransformToObjectId(item.productVariantId)],
                            },
                            createdBy : {$ifNull : ["$createdBy" , user._id]},
                            updatedBy : user._id, lastStockUpdate : new Date(),
                            skuSnapshot: { $ifNull: ['$skuSnapshot', skuSnapshot] },
                            reserved: { $ifNull: ['$reserved', 0] }, sold: { $ifNull: ['$sold', 0] },
                            lowStockThreshold: { $ifNull: ['$lowStockThreshold', 5] },

                            quantity : {$add : [{$ifNull : ['$quantity' , 0]} , receivedQty]},
                            availableQuantity: {$add: [{ $ifNull: ['$availableQuantity', 0] }, receivedQty]},
                        }
                    },
                    {
                        $set : {
                            costPrice : {
                                $cond : {
                                    if : {$eq : ['$quantity' , 0]},
                                    then : newUnitCost,
                                    else :{
                                        $round:[
                                            {
                                                $divide : [ 
                                                    {
                                                        $add : [
                                                            {$multiply : ['$qtyBefore' , '$costBefore']},
                                                            receivedQty * newUnitCost
                                                        ],
                                                    },
                                                        '$quantity'
                                                ]
                                            },
                                            2
                                        ],

                                    }
                                }
                            }
                        }
                    },
                    {
                        $unset: ['qtyBefore', 'costBefore']
                    },
                ],
                upsert: true,
            }
        };
    }

    buildInventoryMovementTransform({ inventory , warehouse, item , isSystemAction = false, beforeQuantity,afterQuantity,type,referenceId , referenceModel,createdBy}:InventoryMovemntReturn<IWareHouseTransformItems>):Partial<IInventoryMovement>{
        return{
            wareHouseId:warehouse._id, wareHouseSnapshot:warehouse.name, productVariantId:item.productVariantId,
            productTitleSnapshot:item.productVariantNameSnapshot,skuSnapshot:inventory.skuSnapshot,
            beforeQuantity,afterQuantity,quantity:`${afterQuantity>beforeQuantity?"+":"-"}${item.quantity}`,
            type,referenceId,referenceModel,createdBy : isSystemAction ? undefined : (createdBy as Types.ObjectId)
        }
    }

    buildInventoryMovementStockAdjustment({ inventory , warehouse, item, beforeQuantity,isSystemAction = false,afterQuantity,type,referenceId , referenceModel,createdBy}:InventoryMovemntReturn<IStockAdjustmentItems>):Partial<IInventoryMovement>{
        return{
            wareHouseId:warehouse._id, wareHouseSnapshot:warehouse.name, productVariantId:item.productVariantId,
            skuSnapshot:inventory.skuSnapshot,beforeQuantity,afterQuantity,
            quantity:`${afterQuantity>beforeQuantity?"+":"-"}${item.difference}`,type,referenceId,referenceModel,
            createdBy : isSystemAction ? undefined : (createdBy as Types.ObjectId)
        }
    }

    buildInventoryMovementPurchase({ inventory , warehouse, item, beforeQuantity,afterQuantity,type,referenceId , isSystemAction = false , referenceModel,createdBy}:InventoryMovemntReturn<ReceivedItemsDTO>):Partial<IInventoryMovement>{
        return{
            wareHouseId:warehouse._id, wareHouseSnapshot:warehouse.name, productVariantId:TransformToObjectId(item.productVariantId as unknown as string),
            skuSnapshot:inventory.skuSnapshot,beforeQuantity,afterQuantity,
            quantity:`+${item.receivedQuantity}`,type,referenceId,referenceModel,
            createdBy : isSystemAction ? undefined : (createdBy as Types.ObjectId)
        }
    }

    buildInventoryMovementOrder({  warehouse, item, beforeQuantity, afterQuantity, type, createdBy, referenceId, referenceModel, isSystemAction }: InventoryMovemntReturn<IOrderItem>): Partial<IInventoryMovement> {
    const returnOrder = type === InventoryMovementType.RETURN;
    const formattedQuantity = returnOrder ? `+${item.quantity}` : `-${item.quantity}`;
    
    return {
        wareHouseId: warehouse._id, 
        wareHouseSnapshot: warehouse.name, 
        productVariantId: item.variantId,
        skuSnapshot: item.skuSnapshot, 
        beforeQuantity, 
        afterQuantity,
        quantity: formattedQuantity, 
        type, 
        createdBy: isSystemAction ? undefined : (createdBy as Types.ObjectId),
        isSystemAction,
        referenceId, 
        referenceModel
    };
    }
}