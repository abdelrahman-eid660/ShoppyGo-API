import { Injectable, NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AllFinancialReviewDTO, GetFinancialQGLDTO } from './dto';
import { FinancialReviewRepository } from 'src/DB/Repository';
import { FinancialCategoryEnum, FinancialSortEnum, FinancialSourceEnum, SharedCurrencyEnum, SortEnum } from 'src/common/enum';
import { TransformToObjectId } from 'src/common/utils/ObjectId';
import { IFinancialReview } from 'src/common/interface';

export interface IAllFinancialReviews {
  summary : {
    totalRevenue: number,
    totalExpenses: number, 
    purchaseExpenses: number,
    inventoryAdjustmentLosses: number,
    totalCOGS: number,
    netProfit: number
  }, 
  data : {
    _id: Types.ObjectId,
    amount: number,
    currency: SharedCurrencyEnum,
    category: FinancialCategoryEnum,
    source: FinancialSourceEnum,
    costOfGoodsSold: number,
    notes?: string,
    createdAt: Date,
    'warehouse.name': string
  }[], 
  pagination : {
    currentPage: number,
    limit : number,
    totalDocs : number,
    totalPages : number, 
    hasNextPage : boolean,
    hasPreviousPage : boolean
  },
  pageSummary: {
    pageRevenue: number,
    pageExpenses: number,
  },
}

@Injectable()
export class FinancialReviewService {
  constructor(
    private readonly financialReviewRepository : FinancialReviewRepository
  ){}

  async findAll(query : AllFinancialReviewDTO) : Promise<IAllFinancialReviews> {
    const {limit = 4 , page = 1 , sort = SortEnum.NEWEST , category , endDate , source , startDate , warehouseId} = query
    const filter : any = {}
    const sortOptions = FinancialSortEnum[sort]
    if(warehouseId !== undefined) filter.warehouseId = TransformToObjectId(warehouseId)
    if(category !== undefined) filter.category = category
    if(source !== undefined) filter.source = source
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = startDate
      if (endDate) filter.createdAt.$lte = endDate
    }
    const skip = (page - 1) * limit
    const results = await this.financialReviewRepository.aggregate([
      {$match : filter},
      {
        $facet : {
          summary : [
            {
              $group : {
                _id : null,
                totalRevenue : {
                  $sum : {
                    $cond : [
                      {$eq : ['$category' , FinancialCategoryEnum.REVENUE]},
                      '$amount',
                      0
                    ]
                  }
                },
                totalExpenses : {
                  $sum : {
                    $cond : [
                      {$in : ['$category' , [FinancialCategoryEnum.EXPENSE , FinancialCategoryEnum.LOSS , FinancialCategoryEnum.REFUND]]},
                      '$amount',
                      0
                    ]
                  }
                },
                totalRefunds : {
                  $sum : {
                    $cond : [
                      {$eq : ['$category' , FinancialCategoryEnum.REFUND]},
                      '$amount',
                      0
                    ]
                  }
                },
                purchaseExpenses : {
                  $sum : {
                    $cond : [
                      {$eq : ['$source' , FinancialSourceEnum.PURCHASE]},
                      '$amount',
                      0
                    ]
                  }
                },
                inventoryAdjustmentLosses : {
                  $sum : {
                    $cond : [
                      {$eq : ['$source' , FinancialSourceEnum.INVENTORY_AUDIT]},
                      '$amount',
                      0
                    ]
                  }
                },
                totalCOGS : {$sum : {$ifNull : ['$costOfGoodsSold' , 0]}}
              }
            },
            {
              $project: {
                _id: 0,
                totalRevenue: { $round: ['$totalRevenue', 2] },
                totalExpenses: { $round: ['$totalExpenses', 2] },
                totalRefunds: { $round: ['$totalRefunds', 2] },
                purchaseExpenses: { $round: ['$purchaseExpenses', 2] },
                inventoryAdjustmentLosses: {$round: ['$inventoryAdjustmentLosses', 2]},
                totalCOGS: { $round: ['$totalCOGS', 2] },
                netProfit: { $round: [{$subtract : ['$totalRevenue' , '$totalExpenses']}, 2] },
              },
            }
          ],
          data : [
            { $sort : sortOptions },
            { $skip : skip },
            { $limit : limit },
            {
              $lookup : {
                from: 'warehouses',
                localField : 'warehouseId',
                foreignField : '_id',
                as : 'warehouse'
              }
            },
            { $unwind : {path : "$warehouse" , preserveNullAndEmptyArrays : true}},
            {
              $project: {
                _id: 1,
                amount: 1,
                currency: 1,
                category: 1,
                source: 1,
                costOfGoodsSold: 1,
                notes: 1,
                createdAt: 1,
                'warehouse.name': 1
              }
            }
          ],
          totalCount : [{$count : 'count'}]
        }
      }
    ])
    const summaryStats = results[0]?.summary[0] || {
      totalRevenue: 0, totalExpenses: 0, purchaseExpenses: 0,
      inventoryAdjustmentLosses: 0,totalCOGS: 0,netProfit: 0
    };
    const data = results[0]?.data || []
    const pageSummary = data.reduce((acc : any , item : any)=>{
      if (item.category === FinancialCategoryEnum.REVENUE) {
        acc.pageRevenue += item.amount || 0
      }else if([FinancialCategoryEnum.EXPENSE, FinancialCategoryEnum.LOSS, FinancialCategoryEnum.REFUND].includes(item.category)){
        acc.pageExpenses += item.amount || 0;
      }
      return acc
    }, { pageRevenue: 0, pageExpenses: 0 })
    const totalRecords = results[0]?.totalCount?.count || 0
    const totalPages = Math.ceil(totalRecords / limit)
    const hasNextPage = page < totalPages
    const hasPreviousPage = page > 1
    return {
      summary : summaryStats, data, 
      pagination : {currentPage: page, limit, totalDocs : totalRecords, totalPages, hasNextPage,hasPreviousPage},
      pageSummary: {
        pageRevenue: Number(pageSummary.pageRevenue.toFixed(2)),
        pageExpenses: Number(pageSummary.pageExpenses.toFixed(2)),
      },
    }
  }

  async findOne({financialId}: GetFinancialQGLDTO) : Promise<IFinancialReview> {
    const financialReview = await this.financialReviewRepository.findOne({filter : {_id : financialId} , options : {
      populate : [
      {path : "warehouseId" , select : "name manager" , populate : [{path : "manager" , select : "firstName lastName role email profileImage phone"}]},
      {path : "referenceId"},
    ]}})
    if(!financialReview) throw new NotFoundException(`This financial record not found`)
    return financialReview
  }

}
