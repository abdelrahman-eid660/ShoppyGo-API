import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { Auth, PermissionsDecorator } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { GetAllPaymentsDTO } from './dto';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';
import { IPagination, IPayment } from 'src/common/interface';

@Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}
  
  
  @Get('all-payments')
  @PermissionsDecorator(PermissionEnum.PAYMENT_VIEW)
  async findAll(@Query() query : GetAllPaymentsDTO):Promise<IPagination<IPayment>> {
    return await this.paymentService.findAll(query);
  }
  
  @Get(':paymentId')
  @PermissionsDecorator(PermissionEnum.PAYMENT_VIEW)
  async findOne(@Param('paymentId' , ObjectIdPipe) paymentId: Types.ObjectId):Promise<IPayment> {
    return await this.paymentService.findOne(paymentId);
  }

}
