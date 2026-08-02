import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { AnalyticsService } from './analytics.service';
import { GetBrandsDemandMetricsResponse, GetCategoriesDemandMetricsResponse, GetCustomersByActivityResponse, GetProductsBySalesResponse, GetSalesOverviewMetricsResponse, getUsersWithZeroOrdersResponse, GetZeroSalesProductsResponse } from './entities/analytics.entity';
import { GetAnalyticsDTO, GetZeroAnalyticsDTO } from './dto';
import { Auth, PermissionsDecorator } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';

@Resolver()
@Auth({roles : [RoleEnum.SUPERADMIN]})
@PermissionsDecorator(PermissionEnum.FINANCIAL_MANAGE)
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}
  @Query(() => [GetProductsBySalesResponse])
  async getProductsBySales(@Args() args : GetAnalyticsDTO):Promise<GetProductsBySalesResponse[]> {
    return await this.analyticsService.getProductsBySales(args);
  }
  @Query(() => [GetZeroSalesProductsResponse])
  async getZeroSalesProducts(@Args() args : GetZeroAnalyticsDTO):Promise<GetZeroSalesProductsResponse[]> {
    return await this.analyticsService.getZeroSalesProducts(args);
  }
  @Query(() => [GetCustomersByActivityResponse])
  async getCustomersByActivity(@Args() args : GetAnalyticsDTO):Promise<GetCustomersByActivityResponse[]> {
    return await this.analyticsService.getCustomersByActivity(args);
  }
  @Query(() => [getUsersWithZeroOrdersResponse])
  async getUsersWithZeroOrders(@Args() args : GetZeroAnalyticsDTO):Promise<getUsersWithZeroOrdersResponse[]> {
    return await this.analyticsService.getUsersWithZeroOrders(args);
  }
  @Query(() => Int)
  async getNewCustomersCount():Promise<number> {
    return await this.analyticsService.getNewCustomersCount();
  }
  @Query(() => GetSalesOverviewMetricsResponse)
  async getSalesOverviewMetrics():Promise<GetSalesOverviewMetricsResponse> {
    return await this.analyticsService.getSalesOverviewMetrics();
  }
  @Query(() => [GetCategoriesDemandMetricsResponse])
  async getCategoriesDemandMetrics(@Args() args : GetAnalyticsDTO):Promise<GetCategoriesDemandMetricsResponse[]> {
    return await this.analyticsService.getCategoriesDemandMetrics(args);
  }
  @Query(() => [GetBrandsDemandMetricsResponse])
  async getBrandsDemandMetrics(@Args() args : GetAnalyticsDTO):Promise<GetBrandsDemandMetricsResponse[]> {
    return await this.analyticsService.getBrandsDemandMetrics(args);
  }
}
