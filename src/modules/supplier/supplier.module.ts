import { Module } from '@nestjs/common';
import { SupplierService } from './supplier.service';
import { SupplierController } from './supplier.controller';
import { SupplierRepository } from 'src/DB/Repository';
import { SupplierModel } from 'src/DB/models';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports : [SupplierModel , SharedAuthenticationModule],
  controllers: [SupplierController],
  providers: [SupplierService , SupplierRepository],
})
export class SupplierModule {}
