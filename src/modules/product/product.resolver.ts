import { Args, ID, Query, Resolver } from "@nestjs/graphql";
import {  PaginationGQLDTO } from "src/common/dto";
import { ProductService } from "./product.service";
import {  Auth, CacheKey, TTL, User } from "src/common/decorator";
import type{ HUserDocument } from "src/DB/models";
import { UseInterceptors } from "@nestjs/common";
import { CustomeCacheInterceptor } from "src/common/interceptor";
import { GetProductResponse, OneProductResponse, PaginationProductsResponse } from "./entity/get-all-products";
import { CacheKeyEnum, RoleEnum } from "src/common/enum";
import { ObjectIdPipe } from "src/common/pipe";
import { Types } from "mongoose";
import { Throttle } from "@nestjs/throttler";
import { UseGuards } from '@nestjs/common';
import {GqlThrottlerGuard} from 'src/common/guard'
@Resolver()
export class ProductResolver { 
    constructor(private readonly productService : ProductService){}

    @Query(()=> PaginationProductsResponse)
    @Auth({isPublic : true})
    @CacheKey(CacheKeyEnum.PRODUCTS)
    @UseInterceptors(CustomeCacheInterceptor)
    @Throttle({ default: { limit: 200, ttl: 60000 } })
    @UseGuards(GqlThrottlerGuard)
    async allProducts(
        @Args() args : PaginationGQLDTO,
        @User() user? : HUserDocument
    ):Promise<PaginationProductsResponse>{
        const result =  await this.productService.findAll(args, user)
        return result
    }

    @Query(()=> PaginationProductsResponse)
    @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
    @CacheKey(CacheKeyEnum.ARCHIEVE_PRODUCTS)
    @Throttle({ default: { limit: 200, ttl: 60000 } })
    @UseInterceptors(CustomeCacheInterceptor)
    async allProductsArchive(
        @Args() args : PaginationGQLDTO,
    ):Promise<PaginationProductsResponse>{
        const result =  await this.productService.findAllArchive(args)
        return result
    }

    @Query(()=> GetProductResponse)
    @Auth({isPublic : true})
    @CacheKey(CacheKeyEnum.PRODUCTS)
    @TTL(3600)
    @Throttle({ default: { limit: 200, ttl: 60000 } })
    @UseInterceptors(CustomeCacheInterceptor)
    async getProduct(
        @Args('productId', { type: () => ID } , ObjectIdPipe) productId : Types.ObjectId,
        @User() user : HUserDocument
    ):Promise<GetProductResponse>{
        const result =  await this.productService.findOne(productId , user)
        return result
    }
    @Query(()=> [OneProductResponse])
    @Auth({isPublic : true})
    @CacheKey(CacheKeyEnum.GET_PRODUCTS_BY_BRAND)
    @TTL(3600)
    @Throttle({ default: { limit: 200, ttl: 60000 } })
    @UseInterceptors(CustomeCacheInterceptor)
    async getProductsByBrand(
        @Args('brandId', { type: () => ID } , ObjectIdPipe) brandId : Types.ObjectId,
        @User() user : HUserDocument
    ):Promise<OneProductResponse[]>{
        const result =  await this.productService.getProductsByBrand(brandId , user)
        return result
    }
    @Query(()=> [OneProductResponse])
    @Auth({isPublic : true})
    @TTL(3600)
    @Throttle({ default: { limit: 200, ttl: 60000 } })
    @CacheKey(CacheKeyEnum.GET_PRODUCTS_BY_CATEGORY)
    @UseInterceptors(CustomeCacheInterceptor)
    async getProductsByCategory(
        @Args('categoryId', { type: () => ID } , ObjectIdPipe) categoryId : Types.ObjectId,
        @User() user : HUserDocument
    ):Promise<OneProductResponse[]>{
        const result =  await this.productService.getProductsByCategory(categoryId , user)
        return result
    }
}