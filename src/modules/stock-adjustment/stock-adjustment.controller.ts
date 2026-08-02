import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { StockAdjustmentService } from './stock-adjustment.service';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { ObjectIdPipe } from 'src/common/pipe';
import { Types } from 'mongoose';
import type{ HUserDocument } from 'src/DB/models';
import { IPagination, IStockAdjustment } from 'src/common/interface';
import { CreateStockAdjustmentDto, GetAllStocksDTO, UpdateStockAdjustmentDto } from './dto';

@Controller('stock-adjustment')
export class StockAdjustmentController {
  constructor(private readonly stockAdjustmentService: StockAdjustmentService) {}


  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.STOCK_ADJUSTMENT_CREATE)
  @Post('create-stock-adjustment')
  async create(@Body() data: CreateStockAdjustmentDto , @User() user : HUserDocument):Promise<IStockAdjustment> {
    return await this.stockAdjustmentService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.STOCK_ADJUSTMENT_VIEW)
  @Get('all-stocks-adjustment')
  async findAll(@Query() query : GetAllStocksDTO):Promise<IPagination<IStockAdjustment>> {
    return await this.stockAdjustmentService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.STOCK_ADJUSTMENT_VIEW)
  @Get(':stockAdjustmentId')
  async findOne(@Param('stockAdjustmentId' , ObjectIdPipe) stockAdjustmentId: Types.ObjectId): Promise<IStockAdjustment> {
    return await this.stockAdjustmentService.findOne(stockAdjustmentId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.STOCK_ADJUSTMENT_UPDATE)
  @Patch(':stockAdjustmentId/update')
  async update(@Param('stockAdjustmentId' , ObjectIdPipe) stockAdjustmentId: Types.ObjectId, @Body() data: UpdateStockAdjustmentDto , @User() user : HUserDocument):Promise<IStockAdjustment> {
    return await this.stockAdjustmentService.update(stockAdjustmentId, data , user);
  }
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.STOCK_ADJUSTMENT_UPDATE)
  @Patch('reject/:stockAdjustmentId')
  async reject(@Param('stockAdjustmentId' , ObjectIdPipe) stockAdjustmentId: Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return await this.stockAdjustmentService.reject(stockAdjustmentId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.STOCK_ADJUSTMENT_UPDATE)
  @Patch('approve/:stockAdjustmentId')
  async approve(@Param('stockAdjustmentId' , ObjectIdPipe) stockAdjustmentId: Types.ObjectId , @User() user : HUserDocument):Promise<{message :string}> {
    return await this.stockAdjustmentService.approve(stockAdjustmentId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.STOCK_ADJUSTMENT_DELETE)
  @Delete(':stockAdjustmentId')
  async remove(@Param('stockAdjustmentId' , ObjectIdPipe) stockAdjustmentId: Types.ObjectId , @User() user : HUserDocument): Promise<string> {
    return await this.stockAdjustmentService.remove(stockAdjustmentId , user);
  }
}
