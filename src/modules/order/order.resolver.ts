import { Args, ID, Mutation, Query, Resolver } from "@nestjs/graphql";
import { AllOrdersResponse, CheckoutOrderResponse, OneOrderResponse, OrderMessageResponse } from "./entities/order.entity";
import { OrderService } from "./order.service";
import { AllOrdersDTO, CreateOrderGQLDTO, RefundArgs, RefundOrderRequestArgs, RejectRefundArgs ,  } from "./dto";
import { Auth, PermissionsDecorator, User } from "src/common/decorator";
import type{ HUserDocument } from "src/DB/models";
import { ObjectIdPipe } from "src/common/pipe";
import { Types } from "mongoose";
import { PermissionEnum, RoleEnum } from "src/common/enum";

@Resolver()
export class OrderResolver {
    constructor(private readonly orderService : OrderService){}
    @Mutation(()=> OneOrderResponse)
    @Auth({})
    @PermissionsDecorator(PermissionEnum.ORDER_CREATE)
    async createOrder(@Args() args : CreateOrderGQLDTO , @User() user : HUserDocument){
        return await this.orderService.create(args , user) 
    }
    @Query(()=> CheckoutOrderResponse)
    @Auth({})
    @PermissionsDecorator(PermissionEnum.ORDER_CHECKOUT)
    async checkout( @Args('orderId', { type: () => ID } , ObjectIdPipe) orderId : Types.ObjectId , @User() user : HUserDocument):Promise<CheckoutOrderResponse>{
        return await this.orderService.checkout(orderId , user) 
    }
    @Query(()=> OrderMessageResponse)
    @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
    @PermissionsDecorator(PermissionEnum.ORDER_CONFIRM)
    async confirmOrder( @Args('orderId', { type: () => ID } , ObjectIdPipe) orderId : Types.ObjectId , @User() user : HUserDocument):Promise<OrderMessageResponse>{
        return await this.orderService.confirmOrder(orderId , user) 
    }
    @Query(()=> OrderMessageResponse)
    @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
    @PermissionsDecorator(PermissionEnum.ORDER_UPDATE)
    async shipped( @Args('orderId', { type: () => ID } , ObjectIdPipe) orderId : Types.ObjectId , @User() user : HUserDocument):Promise<OrderMessageResponse>{
        return await this.orderService.shipped(orderId , user) 
    }
    @Query(()=> OrderMessageResponse)
    @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
    @PermissionsDecorator(PermissionEnum.ORDER_UPDATE)
    async paidOrder( @Args('orderId', { type: () => ID } , ObjectIdPipe) orderId : Types.ObjectId , @User() user : HUserDocument):Promise<OrderMessageResponse>{
        return await this.orderService.paidOrder(orderId , user) 
    }
    @Mutation(()=> OrderMessageResponse)
    @Auth({})
    @PermissionsDecorator(PermissionEnum.ORDER_REFUND_REQUEST)
    async refundOrderRequest( @Args('orderId', { type: () => ID } , ObjectIdPipe) orderId : Types.ObjectId , @User() user : HUserDocument , @Args() data : RefundOrderRequestArgs ):Promise<OrderMessageResponse>{
        return await this.orderService.refundOrderRequest(orderId , user , data) 
    }

    @Mutation(()=> OrderMessageResponse)
    @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
    @PermissionsDecorator(PermissionEnum.ORDER_REJECT_REQUEST)
    async rejectRefundRequest( @Args('orderId', { type: () => ID } , ObjectIdPipe) orderId : Types.ObjectId , @User() user : HUserDocument, @Args() data : RejectRefundArgs):Promise<OrderMessageResponse>{
        return await this.orderService.rejectRefundRequest(orderId , user , data) 
    }
    @Mutation(()=> OrderMessageResponse)
    @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
    @PermissionsDecorator(PermissionEnum.ORDER_REFUND)
    async refundOrder( @Args('orderId', { type: () => ID } , ObjectIdPipe) orderId : Types.ObjectId , @User() user : HUserDocument, @Args() data : RefundArgs):Promise<OrderMessageResponse>{
        return await this.orderService.refundOrder(orderId , user , data) 
    }
    @Query(()=> OneOrderResponse)
    @Auth({})
    @PermissionsDecorator(PermissionEnum.ORDER_VIEW)
    async getOrder( @Args('orderId', { type: () => ID } , ObjectIdPipe) orderId : Types.ObjectId , @User() user : HUserDocument):Promise<OneOrderResponse>{
        return await this.orderService.findOne(orderId , user) 
    }
    @Query(()=> [OneOrderResponse])
    @Auth({})
    @PermissionsDecorator(PermissionEnum.ORDER_VIEW)
    async getOrders(@Args() args : AllOrdersDTO ):Promise<AllOrdersResponse>{
        return await this.orderService.findAll(args) 
    }
}