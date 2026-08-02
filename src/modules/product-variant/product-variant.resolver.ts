import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { ProductVariantService } from './product-variant.service';
import { PaginationGQLDTO } from 'src/common/dto';
import { Auth, CacheKey, PermissionsDecorator, TTL, User } from 'src/common/decorator';
import { CacheKeyEnum, PermissionEnum, RoleEnum } from 'src/common/enum';
import { UseGuards, UseInterceptors } from '@nestjs/common';
import { CustomeCacheInterceptor } from 'src/common/interceptor';
import type{ HUserDocument } from 'src/DB/models';
import { PaginationProductVariantsResponse } from './entities/product-variant.entity';
import { AuthenticationGuard } from 'src/common/guard';
import { ObjectIdPipe } from 'src/common/pipe';
import { Types } from 'mongoose';
import { OneInventoryResponse } from '../inventory/entities/inventory.entity';
import { Throttle } from '@nestjs/throttler';

@Resolver()
export class ProductVariantResolver {
  constructor(private readonly productVariantService: ProductVariantService) {}

    @Query(()=> PaginationProductVariantsResponse)
    @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
    @PermissionsDecorator(PermissionEnum.PRODUCT_VIEW)
    @TTL(3600)
    @Throttle({ default: { limit: 200, ttl: 60000 } })
    @CacheKey(CacheKeyEnum.PRODUCTS_VARIANTS)
    @UseInterceptors(CustomeCacheInterceptor)
    async allProductVariants(
        @Args() args : PaginationGQLDTO,
    ):Promise<PaginationProductVariantsResponse>{
        const result =  await this.productVariantService.findAll(args)
        return result
    }

    @Query(()=> PaginationProductVariantsResponse)
    @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
    @TTL(3600)
    @Throttle({ default: { limit: 200, ttl: 60000 } })
    @CacheKey(CacheKeyEnum.PRODUCTS_VARIANTS)
    @UseInterceptors(CustomeCacheInterceptor)
    async allProductVariantsArchive(
        @Args() args : PaginationGQLDTO,
    ):Promise<PaginationProductVariantsResponse>{
        const result =  await this.productVariantService.findAllArchive(args)
        return result
    }

    @Query(()=> OneInventoryResponse)
    @Auth({isPublic : true})
    @TTL(3600)
    @Throttle({ default: { limit: 200, ttl: 60000 } })
    @CacheKey(CacheKeyEnum.PRODUCTS_VARIANTS)
    @UseInterceptors(CustomeCacheInterceptor)
    async getProductVariant(
        @Args('productVariantId' , ({type : ()=>  ID}) , ObjectIdPipe) productVariantId : Types.ObjectId,
        @User() user : HUserDocument
    ):Promise<OneInventoryResponse>{
        const result =  await this.productVariantService.findOne(productVariantId , user)
        return result
    }
}
