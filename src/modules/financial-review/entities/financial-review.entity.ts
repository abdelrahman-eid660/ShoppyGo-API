import { Field, Float, ID, ObjectType, registerEnumType } from "@nestjs/graphql";
import { Types } from "mongoose";
import { FinancialCategoryEnum, FinancialSourceEnum, ReferenceModelEnum, SharedCurrencyEnum } from "src/common/enum";
import type{ IUser, IWareHouse } from "src/common/interface";
import { PaginationInfo } from "src/modules/product/entity/get-all-products";
import { OneUserResponse } from "src/modules/user/entity";
import { createUnionType } from '@nestjs/graphql';
import { OneOrderResponse } from "src/modules/order/entities/order.entity";
import { OnePurchaseProductResponse } from "src/modules/purchase-products/entities/purchase-product.entity";
import { OneStockAdjustmentResponse } from "src/modules/stock-adjustment/entities/stock-adjustment.entity";
import { OneWarehouseResponse } from "src/modules/warehouse/entities/warehouse.entity";

registerEnumType(FinancialCategoryEnum , {name : "Category"})
registerEnumType(FinancialSourceEnum , {name : "Source"})
registerEnumType(ReferenceModelEnum , {name : "ReferenceModel"})
registerEnumType(SharedCurrencyEnum , {name : "SharedCurrency"})

export interface ISummaryFinancial {
    totalRevenue?: number | undefined 
    totalExpenses?: number | undefined 
    purchaseExpenses?: number | undefined 
    inventoryAdjustmentLosses?: number | undefined 
    totalCOGS?: number | undefined 
    netProfit?: number | undefined
}
export interface IFinancialData {
    _id: Types.ObjectId 
    amount: number 
    currency: SharedCurrencyEnum
    category: FinancialCategoryEnum
    source: FinancialSourceEnum
    costOfGoodsSold: number | undefined
    notes?:string | undefined
    createdAt: Date
    warehouse?: IWareHouse
}

export const FinancialReferenceUnion = createUnionType({
  name: 'FinancialReference',
  types: () => [
    OneOrderResponse,
    OnePurchaseProductResponse,
    OneStockAdjustmentResponse,
  ] as const,

  resolveType(value) {
    if ('orderNumber' in value) return OneOrderResponse;
    if ('supplierId' in value) return OnePurchaseProductResponse;
    if ('stockStatus' in value) return OneStockAdjustmentResponse;

    return null;
  },
});

@ObjectType()
export class OneFinancialReviewResponse {
    @Field(()=>ID)
    _id! : Types.ObjectId
    @Field(()=> OneWarehouseResponse)
    warehouseId!: Types.ObjectId | IWareHouse;
    @Field(() => FinancialReferenceUnion, { nullable: true })
    referenceId?: typeof FinancialReferenceUnion;
    @Field(()=> ReferenceModelEnum)
    referenceModel!: ReferenceModelEnum | undefined;
    @Field(()=> OneUserResponse , {nullable : true})
    createdBy?: Types.ObjectId | IUser | undefined;
    @Field(()=> Boolean , {nullable : true})
    isSystem?: boolean | undefined;
    @Field(()=> FinancialCategoryEnum)
    category!: FinancialCategoryEnum;
    @Field(()=> FinancialSourceEnum)
    source!: FinancialSourceEnum;
    
    @Field(()=> Float)
    amount!: number ;
    @Field(()=> Float , {nullable : true})
    costOfGoodsSold?: number | undefined ;
    @Field(()=> SharedCurrencyEnum)
    currency!: SharedCurrencyEnum ;
    @Field(()=> Float, {nullable : true})
    discountAmountSnapshot?: number | undefined ;
    @Field(()=> Float, {nullable : true})
    shippingCostSnapshot?: number | undefined ;

    @Field(()=> String , {nullable : true})
    notes?: string | undefined;
    @Field(()=> String)
    createdAt!: Date;
    @Field(()=> String , {nullable : true})
    updatedAt?: Date | undefined;
}

@ObjectType()
export class SummaryFinancialResposne {
    @Field(()=> Float , {nullable : true})
    totalRevenue?: number | undefined 
    @Field(()=> Float , {nullable : true})
    totalExpenses?: number | undefined 
    @Field(()=> Float , {nullable : true})
    purchaseExpenses?: number | undefined 
    @Field(()=> Float , {nullable : true})
    inventoryAdjustmentLosses?: number | undefined 
    @Field(()=> Float , {nullable : true})
    totalCOGS?: number | undefined 
    @Field(()=> Float , {nullable : true})
    netProfit?: number | undefined
}

@ObjectType()
export class FinancialDataResposne {
    @Field(()=> ID)
    _id!: Types.ObjectId
    @Field(()=> Float) 
    amount!: number
    @Field(()=> SharedCurrencyEnum) 
    currency!: SharedCurrencyEnum
    @Field(()=> FinancialCategoryEnum)
    category!: FinancialCategoryEnum
    @Field(()=> FinancialSourceEnum)
    source!: FinancialSourceEnum
    @Field(()=> Float , {nullable : true}) 
    costOfGoodsSold!: number | undefined
    @Field(()=> Float , {nullable : true}) 
    subRevenue!: number | undefined
    @Field(()=> String , {nullable : true})
    notes?:string | undefined
    @Field(()=> String , {nullable : true})
    createdAt!: Date
    @Field(()=> OneWarehouseResponse , {nullable : true})
    warehouse?: IWareHouse
}

@ObjectType()
export class PageSummaryResponse{
    @Field(()=> Float)
    pageRevenue!: number
    @Field(()=> Float)
    pageExpenses!: number
}

@ObjectType()
export class AllFinancialReviewResponse {
    @Field(()=> SummaryFinancialResposne , {nullable : true})
    summary? : ISummaryFinancial | undefined
    @Field(()=> PaginationInfo)
    pagination!: {
        currentPage?: number | undefined;
        limit: number;
        totalDocs?: number | undefined;
        totalPages?: number | undefined;
        hasNextPage: boolean | null;
        hasPreviousPage: boolean | null;
    };
    @Field(()=> [FinancialDataResposne] , {nullable : true})
    data? : IFinancialData[] | undefined
    @Field(()=> PageSummaryResponse)
    pageSummary!: PageSummaryResponse
}
