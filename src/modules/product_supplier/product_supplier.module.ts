import { Module } from '@nestjs/common';
import { ProductSupplierService } from './product_supplier.service';
import { ProductSupplierController } from './product_supplier.controller';
import { ProductRepository, ProductSupplierRepository, SupplierRepository } from 'src/DB/Repository';
import { ProductModel, ProductSupplierModel, SupplierModel } from 'src/DB/models';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports : [ProductSupplierModel , SupplierModel , ProductModel  , SharedAuthenticationModule],
  controllers: [ProductSupplierController],
  providers: [ProductSupplierService , ProductSupplierRepository , SupplierRepository , ProductRepository],
})
export class ProductSupplierModule {}
