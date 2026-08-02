import { Module } from '@nestjs/common';
import { ShippingZoneService } from './shipping-zone.service';
import { SharedAuthenticationModule } from 'src/common/modules';
import { ShippingZoneModel } from 'src/DB/models';
import { ShippingZoneRepository } from 'src/DB/Repository';
import { ShippingZoneController } from './shipping-zone.controller';

@Module({
  imports : [SharedAuthenticationModule , ShippingZoneModel],
  controllers: [ShippingZoneController],
  providers: [ShippingZoneService , ShippingZoneRepository],
})
export class ShippingZoneModule {}
