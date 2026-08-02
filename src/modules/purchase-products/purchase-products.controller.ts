import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { PurchaseProductsService } from './purchase-products.service';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { ObjectIdPipe } from 'src/common/pipe';
import { Types } from 'mongoose';
import type{ HUserDocument } from 'src/DB/models';
import { IPagination, IPurchaseProducts } from 'src/common/interface'; 
import { AllPurchaseProcess , CreatePurchaseProductDto , ReceivedDTO, UpdatePurchaseProductDto} from './dto';

@Controller('purchase-products')
export class PurchaseProductsController {
  constructor(private readonly purchaseProductsService: PurchaseProductsService) {}
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PURCHASE_PRODUCT_ADD)
  @Post('create-purchase-products')
  async create(@Body() data: CreatePurchaseProductDto , @User() user : HUserDocument):Promise<IPurchaseProducts> {
    return await this.purchaseProductsService.create(data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PURCHASE_PRODUCT_VIEW)
  @Get('all-purchase-process')
  async findAll(@Query() query : AllPurchaseProcess): Promise<IPagination<IPurchaseProducts>> {
    return await this.purchaseProductsService.findAll(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PURCHASE_PRODUCT_VIEW)
  @Get(':PurchaseProductId')
  async findOne(@Param('PurchaseProductId' , ObjectIdPipe) PurchaseProductId: Types.ObjectId): Promise<IPurchaseProducts> {
    return await this.purchaseProductsService.findOne(PurchaseProductId);
  }
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PURCHASE_PRODUCT_UPDATE)
  @Patch(':PurchaseProductId/cancel')
  async cancelProcess(@Param('PurchaseProductId' , ObjectIdPipe) PurchaseProductId: Types.ObjectId , @User() user : HUserDocument): Promise<IPurchaseProducts> {
    return await this.purchaseProductsService.cancelProcess(PurchaseProductId , user);
  }
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PURCHASE_PRODUCT_UPDATE)
  @Patch(':PurchaseProductId/confirm')
  async confirmProcess(@Param('PurchaseProductId' , ObjectIdPipe) PurchaseProductId: Types.ObjectId , @User() user : HUserDocument): Promise<IPurchaseProducts> {
    return await this.purchaseProductsService.confirmProcess(PurchaseProductId , user);
  }
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PURCHASE_PRODUCT_UPDATE)
  @Patch('received-purchase-products/:PurchaseProductId')
  async receivedPurchaseProducts(@Param('PurchaseProductId' , ObjectIdPipe) PurchaseProductId: Types.ObjectId , @User() user : HUserDocument ,@Body() data : ReceivedDTO): Promise<IPurchaseProducts> {
    return await this.purchaseProductsService.receivedPurchaseProducts(PurchaseProductId , user , data);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.PURCHASE_PRODUCT_UPDATE)
  @Patch(':PurchaseProductId/update')
  async update(@Param('PurchaseProductId' , ObjectIdPipe) PurchaseProductId: Types.ObjectId, @Body() data: UpdatePurchaseProductDto , @User() user : HUserDocument): Promise<IPurchaseProducts | undefined> {
    return await this.purchaseProductsService.update(PurchaseProductId, data , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.PURCHASE_PRODUCT_DELETE)
  @Delete(':PurchaseProductId')
  async remove(@Param('PurchaseProductId' , ObjectIdPipe) PurchaseProductId: Types.ObjectId , @User() user : HUserDocument) : Promise<string> {
    return await this.purchaseProductsService.remove(PurchaseProductId , user);
  }
}
