import { Module } from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CouponController } from './coupon.controller';
import { CouponModel } from 'src/DB/models';
import { SharedAuthenticationModule } from 'src/common/modules';
import { CouponRepository } from 'src/DB/Repository';
import { S3Service } from 'src/common/service';

@Module({
  imports : [CouponModel , SharedAuthenticationModule],
  controllers: [CouponController],
  providers: [CouponService , CouponRepository ,S3Service],
})
export class CouponModule {}
