import { Injectable } from "@nestjs/common";
import { AnyBulkWriteOperation, QueryFilter, Types } from 'mongoose';
import { IProductVariant } from "../interface";
export type adjustStock =  {
    productVariantId : Types.ObjectId ,
    quantityChange : number ,
    type : 'inc' | 'dec',
}
@Injectable()
export class AdjustStockService {
    constructor(){}
    adjustStock({productVariantId, quantityChange , type = 'inc'} :adjustStock) : AnyBulkWriteOperation{
        const stock = type === 'inc' ? quantityChange : -quantityChange
        const filter: QueryFilter<IProductVariant> = { _id: productVariantId };
        if (type === 'dec') {
            filter.stock = { $gte: quantityChange };
        }   
        return { updateOne: {filter, update: { $inc: { stock } }}}
    }
}