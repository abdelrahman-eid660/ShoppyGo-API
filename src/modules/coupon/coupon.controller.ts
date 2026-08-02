import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { Types } from 'mongoose';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { AllCouponDTO, CreateCouponDto, UpdateCouponDto } from './dto';

@Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
@Controller('coupon')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}
  
  @PermissionsDecorator(PermissionEnum.COUPON_CREATE)
  @Post('create-coupon')
  async create(@Body() data: CreateCouponDto , @User() user : HUserDocument) {
    return await this.couponService.create(data , user);
  }
  
  @Auth({})
  @PermissionsDecorator(PermissionEnum.COUPON_VIEW)
  @Get('all-coupons')
  async findAll(@Query() query : AllCouponDTO , @User() user : HUserDocument) {
    return await this.couponService.findAll(query , user);
  }
  
  @Auth({})
  @PermissionsDecorator(PermissionEnum.COUPON_VIEW)
  @Get(':couponId')
  async findOne(@Param('couponId') couponId: Types.ObjectId , user : HUserDocument) {
    return await this.couponService.findOne(couponId , user);
  }

  @PermissionsDecorator(PermissionEnum.COUPON_UPDATE)
  @Patch(':couponId/update')
  async update(@Param('couponId') couponId: Types.ObjectId, @Body() data: UpdateCouponDto , @User() user : HUserDocument) {
    return await this.couponService.update(couponId, data , user);
  }

  @PermissionsDecorator(PermissionEnum.COUPON_UPDATE)
  @Patch('disable/:couponId')
  async disable(@Param('couponId') couponId: Types.ObjectId , @User() user : HUserDocument) {
    return await this.couponService.disable(couponId , user);
  }
}
