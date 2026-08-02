import { Args, ID, Mutation, Resolver } from "@nestjs/graphql";
import { PurchaseProductsService } from "./purchase-products.service";
import { ObjectIdPipe } from "src/common/pipe";
import { Types } from "mongoose";
import { Auth, PermissionsDecorator, User } from "src/common/decorator";
import type{ HUserDocument } from "src/DB/models";
import { PermissionEnum, RoleEnum } from "src/common/enum";
import { ReceivedDTO } from "./dto";
import { OnePurchaseProductResponse } from "./entities/purchase-product.entity";

@Resolver()
@Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
export class PurchaseProductsResolver {
    constructor(private readonly purchaseProductsService : PurchaseProductsService){}
    @Mutation(()=> OnePurchaseProductResponse)
    @PermissionsDecorator(PermissionEnum.PURCHASE_PRODUCT_UPDATE)
    async receivedPurchaseProducts(
        @Args('purchaseProductId' , ({type : ()=> ID}), ObjectIdPipe) purchaseProductId : Types.ObjectId , 
        @User() user : HUserDocument,
        @Args('input') input : ReceivedDTO
    ):Promise<OnePurchaseProductResponse>{
        return await this.purchaseProductsService.receivedPurchaseProducts(purchaseProductId , user , input)
    }
}