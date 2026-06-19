import {  Get, Post, Body, Patch, Param, Delete, Query, Controller } from '@nestjs/common';
import { BrandService } from './brand.service';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { BrandDto } from './dto';
import type { HUserDocument } from 'src/DB/models';
import { PaginationDTO } from 'src/common/dto';
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_CREATE)
  @Post('create-brand')
  async createBrand(@Body() body: BrandDto , @User() user : HUserDocument) {
    return await this.brandService.createBrand(body ,user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_UPDATE)
  @Patch('/:brandId/update')
  async updateBrand(@Body() body: BrandDto , @User() user : HUserDocument , @Param('brandId') brandId : string) {
    return await this.brandService.updateBrand(body ,user , brandId);
  }

  @Auth({})
  @PermissionsDecorator(PermissionEnum.BRAND_VIEW)
  @Get('all-brands')
  async allBrands(@Query() query : PaginationDTO ) {
    return this.brandService.allBrands(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.BRAND_VIEW)
  @Get('all-brands-archive')
  async allBrandsArchive(@Query() query : PaginationDTO ) {
    return this.brandService.AllBrandsArchive(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.BRAND_VIEW)
  @Get(':brandId')
  async getBrand(@Param('brandId') brandId: string) {
    return await this.brandService.getBrand(brandId);
  }
  
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_VIEW)
  @Patch('soft-delete/:brandId')
  async softDelete(@Param('brandId') brandId: string) {
    return await this.brandService.softDelete(brandId);
  }
  
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_VIEW)
  @Patch('restore/:brandId')
  async restore(@Param('brandId') brandId: string) {
    return await this.brandService.restore(brandId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_VIEW)
  @Delete('remove/:brandId')
  async removeBrand(@Param('brandId') brandId: string) {
    return await this.brandService.removeBrand(brandId);
  }
}
