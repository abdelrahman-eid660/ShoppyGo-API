import { Injectable } from '@nestjs/common';
import { OrderRepository, ProductVariantRepository, UserRepository } from 'src/DB/Repository';
import { GetAnalyticsDTO, GetZeroAnalyticsDTO } from './dto';
import { OrderStatusEnum } from 'src/common/enum';
import { Types } from 'mongoose';

interface IGetProductsBySales {
  _id : Types.ObjectId
  variantId: Types.ObjectId
  totalQuantitySold: number
  totalRevenue: number
  skuSnapshot: string
  imageSnapshot: string
  currentPrice: number
}
interface IGetZeroSalesProducts {
  _id : Types.ObjectId
  sku: string,
  price: number,
  totalQuantitySold: number
}
interface IGetCustomersByActivity {
  userId: Types.ObjectId,
  totalOrdersCount: number
  totalSpent: number
  lastOrderDate: Date,
  firstName: string,
  lastName: string
  email: string
  phone: string
}
interface IGetUsersWithZeroOrders {
  _id: Types.ObjectId,
  createdAt: Date,
  firstName: string,
  lastName: string
  email: string
  phone: string
}
interface IGetSalesOverviewMetrics {
  todayRevenue : number
  todayOrdersCount : number
  monthlyRevenue : number
  monthlyOrdersCount : number
  monthlyAOV : number
}
interface IGetDailySalesChartData {
  date: string
  sales: number
  orders: number
}
interface IGetCategoriesDemandMetrics {
  categoryId: Types.ObjectId
  name: string
  image : string
  quantitySold: number
  revenue: number
}
interface IGetbrandsDemandMetrics {
  brandId: Types.ObjectId
  name: string
  image : string
  quantitySold: number
  revenue: number
}
@Injectable()
export class AnalyticsService {
  constructor(
    private readonly orderRepository : OrderRepository,
    private readonly productVariantRepository : ProductVariantRepository,
    private readonly userRepository : UserRepository,
  ){}

  async getProductsBySales({limit , sortType = -1} : GetAnalyticsDTO) :Promise<IGetProductsBySales[]>{
    const results = await this.orderRepository.aggregate([
      {
        $match : {
          status : {
            $in : [OrderStatusEnum.DELIVERED , OrderStatusEnum.CONFIRMED]
          }
        }
      },
      {$unwind : '$items'},
      {
        $group : {
          _id : '$items.variantId',
          totalQuantitySold : {$sum : '$items.quantity'},
          totalRevenue : {$sum : '$items.subTotal'},
          skuSnapshot: { $first: '$items.skuSnapshot' },
          imageSnapshot: { $first: '$items.imageSnapshot' }
        }
      },
      {$sort : {totalQuantitySold : sortType}},
      {$limit : limit},
      {
        $lookup : {
          from : 'productvariants',
          localField: '_id',
          foreignField : '_id',
          as : 'variantDetails'
        }
      },
      {
        $unwind : {path : '$variantDetails' , preserveNullAndEmptyArrays: true}
      },
      {
        $project : {
          _id : 1,
          variantId: '$_id',
          totalQuantitySold: 1,
          totalRevenue: 1,
          skuSnapshot: 1,
          imageSnapshot: 1,
          currentPrice: '$variantDetails.price'
        }
      }
    ])    
    return results
  }

  async getZeroSalesProducts({limit} : GetZeroAnalyticsDTO) :Promise<IGetZeroSalesProducts[]> {
    const results = await this.productVariantRepository.aggregate([
      {
        $lookup: {
          from: 'orders',
          let: { variantId: '$_id' },
          pipeline: [
            { $unwind: '$items' },
            {
              $match: {
                $expr: { $eq: ['$items.variantId', '$$variantId'] },
                status: { $in: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.DELIVERED] }
              }
            }
          ],
          as: 'matchedOrders'
        }
      },
      {
        $match: {matchedOrders: { $size: 0 }}
      },
      { $limit: Number(limit) },
      {
        $project: {
          _id: 1,
          sku: 1,
          price: 1,
          totalQuantitySold: { $literal: 0 }
        }
      }
    ]);
    return results
  }
  
  async getCustomersByActivity({limit = 5 , sortType = -1} : GetAnalyticsDTO):Promise<IGetCustomersByActivity[]> {
    const results =  await this.orderRepository.aggregate([
      {
        $match: {
          status: { 
            $in: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.DELIVERED] 
          }
        }
      },
      {
        $group: {
          _id: '$createdBy',
          totalOrdersCount: { $sum: 1 },
          totalSpent: { $sum: '$totalAmount' },
          lastOrderDate: { $max: '$createdAt' }
        }
      },
      { $sort: { totalOrdersCount: sortType, totalSpent: sortType } },
      { $limit: limit},
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'customerDetails'
        }
      },
      { 
        $unwind: { 
          path: '$customerDetails', 
          preserveNullAndEmptyArrays: true 
        } 
      },

      {
        $project: {
          _id: 0,
          userId: '$_id',
          totalOrdersCount: 1,
          totalSpent: 1,
          lastOrderDate: 1,
          firstName: '$customerDetails.firstName',
          lastName: '$customerDetails.lastName',
          email: '$customerDetails.email',
          phone: '$customerDetails.phone'
        }
      }
    ]);
    return results
  }

  async getUsersWithZeroOrders({limit} : GetZeroAnalyticsDTO) : Promise<IGetUsersWithZeroOrders[]> {
    const results = await this.userRepository.aggregate([
      {
        $match: {deletedAt: {$exists : false}}
      },
      {
        $lookup: {
          from: 'orders',
          localField: '_id',
          foreignField: 'createdBy',
          as: 'userOrders'
        }
      },
      {
        $match: {userOrders: { $size: 0 }}
      },
      { $limit: limit },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          phone: 1,
          createdAt: 1
        }
      }
    ]);
    return results
  }

  async getNewCustomersCount() : Promise<number>{
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const newCustomers = await this.userRepository.countDocuments({filter : {createdAt: { $gte: startOfMonth }, deletedAt: {$exists : false}}});
    return newCustomers
  }

  async getSalesOverviewMetrics() : Promise<IGetSalesOverviewMetrics> {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [metrics] = await this.orderRepository.aggregate([
      {
        $match: {
          status: { $in: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.DELIVERED] }
        }
      },
      {
        $facet: {
          todaySales: [
            { $match: { createdAt: { $gte: startOfToday } } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' },
                ordersCount: { $sum: 1 }
              }
            }
          ],
          monthlySales: [
            { $match: { createdAt: { $gte: startOfCurrentMonth } } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: '$totalAmount' },
                ordersCount: { $sum: 1 },
                averageOrderValue: { $avg: '$totalAmount' } // متوسط قيمة الطلب
              }
            }
          ]
        }
      },
      {
        $project: {
          todayRevenue: { $ifNull: [{ $arrayElemAt: ['$todaySales.totalRevenue', 0] }, 0] },
          todayOrdersCount: { $ifNull: [{ $arrayElemAt: ['$todaySales.ordersCount', 0] }, 0] },
          monthlyRevenue: { $ifNull: [{ $arrayElemAt: ['$monthlySales.totalRevenue', 0] }, 0] },
          monthlyOrdersCount: { $ifNull: [{ $arrayElemAt: ['$monthlySales.ordersCount', 0] }, 0] },
          monthlyAOV: { $ifNull: [{ $arrayElemAt: ['$monthlySales.averageOrderValue', 0] }, 0] }
        }
      }
    ]);
    return metrics;
  }

  async getDailySalesChartData(year: number, month: number) : Promise<IGetDailySalesChartData[]> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
      return await this.orderRepository.aggregate([
        {
          $match: {
            status: { $in: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.DELIVERED] },
            createdAt: { $gte: startDate, $lte: endDate }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            totalSales: { $sum: '$totalAmount' },
            totalOrders: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } },
        {
          $project: {
            _id: 0,
            date: '$_id',
            sales: '$totalSales',
            orders: '$totalOrders'
          }
        }
      ]);
  }

  async getCategoriesDemandMetrics({limit , sortType = -1} : GetAnalyticsDTO) : Promise<IGetCategoriesDemandMetrics[]> {
    const [result] = await this.orderRepository.aggregate([
      {
        $match: {
          status: { $in: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.DELIVERED] }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'productvariants',
          localField: 'items.variantId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $lookup: {
          from: 'categories',
          localField: 'productDetails.categoryId',
          foreignField: '_id',
          as: 'categoryDetails'
        }
      },
      { $unwind: '$categoryDetails' },
      {
        $group: {
          _id: '$categoryDetails._id',
          categoryName: { $first: '$categoryDetails.name' },
          categoryImage: { $first: '$categoryDetails.image' },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalQuantitySold: sortType } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          categoryId: '$_id',
          name: '$categoryName',
          image : '$categoryImage',
          quantitySold: '$totalQuantitySold',
          revenue: '$totalRevenue',
        }
      }
    ]);
    return result;
  }

  async getBrandsDemandMetrics({limit , sortType = -1} : GetAnalyticsDTO) : Promise<IGetbrandsDemandMetrics[]> {
    const [result] = await this.orderRepository.aggregate([
      {
        $match: {
          status: { $in: [OrderStatusEnum.CONFIRMED, OrderStatusEnum.DELIVERED] }
        }
      },
      { $unwind: '$items' },
      {
        $lookup: {
          from: 'productvariants',
          localField: 'items.variantId',
          foreignField: '_id',
          as: 'productDetails'
        }
      },
      { $unwind: '$productDetails' },
      {
        $lookup: {
          from: 'brands',
          localField: 'productDetails.brandId',
          foreignField: '_id',
          as: 'brandDetails'
        }
      },
      { $unwind: '$brandDetails' },
      {
        $group: {
          _id: '$brandDetails._id',
          brandName: { $first: '$brandDetails.name' },
          brandImage: { $first: '$brandDetails.image' },
          totalQuantitySold: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      { $sort: { totalQuantitySold: sortType } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          brandId: '$_id',
          name: '$brandName',
          image : '$brandImage',
          quantitySold: '$totalQuantitySold',
          revenue: '$totalRevenue',
        }
      }
    ]);
    return result;
  }
  
}
