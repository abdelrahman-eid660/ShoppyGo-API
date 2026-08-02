import { Args, Query, Resolver } from "@nestjs/graphql";
import { FinancialReviewService } from "./financial-review.service";
import { AllFinancialReviewDTO, GetFinancialQGLDTO } from "./dto";
import { AllFinancialReviewResponse, OneFinancialReviewResponse } from "./entities/financial-review.entity";
import { Auth, CacheKey, PermissionsDecorator } from "src/common/decorator";
import { CacheKeyEnum, PermissionEnum, RoleEnum } from "src/common/enum";
import { UseInterceptors } from "@nestjs/common";
import { CustomeCacheInterceptor } from "src/common/interceptor";

@Resolver()
@Auth({roles : [RoleEnum.SUPERADMIN]})
@PermissionsDecorator(PermissionEnum.FINANCIAL_MANAGE)
export class FinancialReviewResolver {
    constructor(private readonly financialReviewService : FinancialReviewService){}

    @Query(()=> AllFinancialReviewResponse)
    async allFinancialReviews(@Args() args : AllFinancialReviewDTO ):Promise<AllFinancialReviewResponse>{
        const result = await this.financialReviewService.findAll(args)
        return result
    }

    @Query(()=> OneFinancialReviewResponse)
    async FinancialReview(@Args() args : GetFinancialQGLDTO ):Promise<OneFinancialReviewResponse>{
        const result = await this.financialReviewService.findOne(args)
        return result
    }

}