import { Controller, Get, Post, Body, Patch, Param, Req, Query, UseInterceptors } from '@nestjs/common';
import { OrderService } from './order.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CancelDTO, RefundDTO, RefundOrderRequestArgs, RefundOrderRequestDTO, RejectRefundDTO } from './dto/update-order.dto';
import { Auth, CacheKey, PermissionsDecorator, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { Types } from 'mongoose';
import { AllOrdersDTO } from './dto';
import type{ Request } from 'express';
import { ObjectIdPipe } from 'src/common/pipe';
import type { OrderActor } from 'src/common/types';
import { CacheKeyEnum, PermissionEnum, RoleEnum } from 'src/common/enum';
import { IOrder, IPagination } from 'src/common/interface';
import { CustomeCacheInterceptor } from 'src/common/interceptor';
import { SkipThrottle, Throttle } from '@nestjs/throttler';

@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Auth({})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.ORDER_CREATE)
  @Post('create-order')
  async create(@Body() data: CreateOrderDto , @User() user : HUserDocument) : Promise<IOrder> {
    return await this.orderService.create(data , user);
  }

  @Auth({})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.ORDER_VIEW)
  @Get('all-orders')
  async findAll(@Query() query : AllOrdersDTO) :Promise<IPagination<IOrder>> {
    return await this.orderService.findAll(query);
  }

  @Auth({})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.ORDER_VIEW)
  @CacheKey(CacheKeyEnum.ORDER)
  @UseInterceptors(CustomeCacheInterceptor)
  @Get(':orderId')
  async findOne(@Param('orderId' , ObjectIdPipe) orderId: Types.ObjectId , @User() user : HUserDocument): Promise<IOrder> {
    return await this.orderService.findOne(orderId , user);
  }

  @Auth({})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.ORDER_CHECKOUT)
  @Patch(':orderId/checkout')
  async checkout(@Param('orderId' , ObjectIdPipe) orderId: Types.ObjectId , @User() user : HUserDocument):Promise<{order : IOrder , payment_url : string | null}> {
    return await this.orderService.checkout(orderId , user);
  }

  @SkipThrottle()
  @Post('webhook')
  async webhook(@Req() req : Request) {
    return await this.orderService.webhook(req);
  }

  @Auth({})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.ORDER_CANCEL)
  @Patch(':orderId/cancel')
  async cancelOrder(@Param('orderId' , ObjectIdPipe) orderId: Types.ObjectId , @User() user : OrderActor , @Body() data : CancelDTO): Promise<{message : string}> {
    return await this.orderService.cancelOrder(orderId , user , data);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.ORDER_CONFIRM)
  @Patch(':orderId/confirm')
  async confirmOrder(@Param('orderId' , ObjectIdPipe) orderId: Types.ObjectId , @User() user : HUserDocument): Promise<{message : string}> {
    return await this.orderService.confirmOrder(orderId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.ORDER_UPDATE)
  @Patch(':orderId/shipped')
  async shipped(@Param('orderId' , ObjectIdPipe) orderId: Types.ObjectId , @User() user : HUserDocument): Promise<{message : string}> {
    return await this.orderService.shipped(orderId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.ORDER_UPDATE)
  @Patch(':orderId/paid')
  async paidOrder(@Param('orderId' , ObjectIdPipe) orderId: Types.ObjectId , @User() user : HUserDocument): Promise<{message : string}> {
    return await this.orderService.paidOrder(orderId , user);
  }

  @Auth({})
  @PermissionsDecorator(PermissionEnum.ORDER_REFUND_REQUEST)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post(':orderId/refund-request')
  async refundOrderRequest(@Param('orderId' , ObjectIdPipe) orderId: Types.ObjectId , @User() user : HUserDocument , @Body() data  : RefundOrderRequestArgs): Promise<{message : string}> {
    return await this.orderService.refundOrderRequest(orderId , user , data);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.ORDER_REJECT_REQUEST)
  @Post(':orderId/reject-refund-request')
  async rejectRefundRequest(@Param('orderId' , ObjectIdPipe) orderId: Types.ObjectId , @User() user : HUserDocument , @Body() data  : RejectRefundDTO): Promise<{message : string}> {
    return await this.orderService.rejectRefundRequest(orderId , user , data);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.ORDER_REFUND)
  @Patch(':orderId/refund')
  async refundOrder(@Param('orderId' , ObjectIdPipe) orderId: Types.ObjectId , @User() user : HUserDocument , @Body() data : RefundDTO): Promise<{message : string}> {
    return await this.orderService.refundOrder(orderId , user , data);
  }
}
