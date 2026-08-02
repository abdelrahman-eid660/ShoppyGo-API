import { Module } from '@nestjs/common';
import { StockAlertService } from './stock-alert.service';
import { StockAlertController } from './stock-alert.controller';
import { StockAlertModel } from 'src/DB/models';
import { StockAlertRepository } from 'src/DB/Repository';
import { SharedAuthenticationModule } from 'src/common/modules';

@Module({
  imports : [StockAlertModel , SharedAuthenticationModule],
  controllers: [StockAlertController],
  providers: [StockAlertService , StockAlertRepository],
})
export class StockAlertModule {}
