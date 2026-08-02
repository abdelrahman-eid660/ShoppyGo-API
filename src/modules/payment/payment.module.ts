import { Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PaymentController } from './payment.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import {  PaymentModel } from 'src/DB/models';
import { PaymentRepository } from 'src/DB/Repository';

@Module({
  imports : [SharedAuthenticationModule , PaymentModel],
  controllers: [PaymentController],
  providers: [PaymentService , PaymentRepository ],
})
export class PaymentModule {}
