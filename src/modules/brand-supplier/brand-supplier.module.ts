import { Module } from '@nestjs/common';
import { BrandSupplierService } from './brand-supplier.service';
import { BrandSupplierController } from './brand-supplier.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import { BrandModel, BrandSupplierModel, SupplierModel } from 'src/DB/models';
import { BrandRepository, BrandSupplierRepository, SupplierRepository } from 'src/DB/Repository';

@Module({
  imports : [SharedAuthenticationModule , BrandSupplierModel , BrandModel , SupplierModel],
  controllers: [BrandSupplierController],
  providers: [BrandSupplierService , BrandSupplierRepository , SupplierRepository , BrandRepository],
})
export class BrandSupplierModule {}
