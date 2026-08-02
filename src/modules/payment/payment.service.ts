/* eslint-disable @typescript-eslint/restrict-template-expressions */
import { Injectable, NotFoundException } from '@nestjs/common';
import { GetAllPaymentsDTO } from './dto';
import { Types } from 'mongoose';
import { PaymentRepository } from 'src/DB/Repository';
import { PaymentSortEnum, SortEnum } from 'src/common/enum';
import { IPagination, IPayment } from 'src/common/interface';

@Injectable()
export class PaymentService {
  constructor(
    private readonly paymentRepositroy : PaymentRepository
  ){}

  async findAll(query : GetAllPaymentsDTO):Promise<IPagination<IPayment>> {
    const { page = 1 , limit = 4 , sort = SortEnum.NEWEST , search ,paymentMethodType , status  } = query || {};
    const sortOption = PaymentSortEnum[sort] || PaymentSortEnum[SortEnum.NEWEST]
    const payments = await this.paymentRepositroy.paginate({filter : {
      ...(search && {orderNumber : new RegExp(search , 'i')}),
      ...(status && {status}),
    } , 
    limit , page , sort : sortOption, options : {populate : [
      {path : "orderId" , select : "orderNumber"},
    ]}})
    return payments;
  }

  async findOne(paymentId: Types.ObjectId): Promise<IPayment> {
    const payment = await this.paymentRepositroy.findOne({filter: { _id: paymentId },
      options: {populate: [
        {path: "orderId",select: "orderNumber totalAmount paymentMethod paymentStatus currency createdAt items" },
        { path: "createdBy", select: "firstName lastName role email" },
        { path: "updatedBy", select: "firstName lastName role email" }
      ]}
    });

    if (!payment) {
      throw new NotFoundException(`Fail to find this payment process ${paymentId}`);
    }
  
    return payment;
  }

}
