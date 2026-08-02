import { RoleEnum } from 'src/common/enum';
import { Controller, Get, Post, Body, Patch, Param, Query } from '@nestjs/common';
import { StockAlertService } from './stock-alert.service';
import { AllStockAlerts, CreateStockAlertDto, UpdateStockAlertDto } from './dto';
import { Auth, User } from 'src/common/decorator';
import type{ HUserDocument } from 'src/DB/models';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';
import { IPagination, IStockAlert } from 'src/common/interface';

@Controller('stock-alert')
export class StockAlertController {
  constructor(private readonly stockAlertService: StockAlertService) {}

  @Auth({})
  @Post('notify-me')
  async create(@Body() data: CreateStockAlertDto , @User() user : HUserDocument):Promise<string> {
    return await this.stockAlertService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @Get('all-stock-alerts')
  async findAll(@Query() query : AllStockAlerts):Promise<IPagination<IStockAlert>> {
    return await this.stockAlertService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @Get(':stockId')
  async findOne(@Param('stockId' , ObjectIdPipe) stockId: Types.ObjectId):Promise<IStockAlert> {
    return await this.stockAlertService.findOne(stockId);
  }

  @Auth({})
  @Patch('disable-notify-me/:stockId')
  async update(@Param('stockId' , ObjectIdPipe) stockId: Types.ObjectId, @Body() data: UpdateStockAlertDto , @User() user : HUserDocument):Promise<string> {
    return await this.stockAlertService.update(stockId, data , user);
  }

}
