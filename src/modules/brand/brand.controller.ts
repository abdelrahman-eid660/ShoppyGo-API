import {  Get, Post, Body, Patch, Param, Delete, Query, Controller, UseInterceptors } from '@nestjs/common';
import { BrandService } from './brand.service';
import { Auth, CacheKey, PermissionsDecorator, User } from 'src/common/decorator';
import { CacheKeyEnum, PermissionEnum, RoleEnum } from 'src/common/enum';
import { BrandDto } from './dto';
import type { HUserDocument } from 'src/DB/models';
import { PaginationDTO } from 'src/common/dto';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';
import { IBrand, IPagination } from 'src/common/interface';
import { CustomeCacheInterceptor } from 'src/common/interceptor';
import { Throttle } from '@nestjs/throttler';
@Controller('brand')
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_CREATE)
  @Post('create-brand')
  async createBrand(@Body() body: BrandDto , @User() user : HUserDocument): Promise<IBrand> {
    return await this.brandService.createBrand(body ,user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_UPDATE)
  @Patch('/:brandId/update')
  async updateBrand(@Body() body: BrandDto , @User() user : HUserDocument , @Param('brandId' , ObjectIdPipe) brandId : Types.ObjectId): Promise<IBrand> {
    return await this.brandService.updateBrand(body ,user , brandId);
  }

  @Auth({isPublic : true})
  @CacheKey(CacheKeyEnum.BRAND)
  @UseInterceptors(CustomeCacheInterceptor)
  @PermissionsDecorator(PermissionEnum.BRAND_VIEW)
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @Get('all-brands')
  async allBrands(@Query() query : PaginationDTO ): Promise<IPagination<IBrand>>  {
    return this.brandService.allBrands(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.BRAND_VIEW)
  @Get('all-brands-archive')
  async allBrandsArchive(@Query() query : PaginationDTO ): Promise<IPagination<IBrand>>  {
    return this.brandService.AllBrandsArchive(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.BRAND_VIEW)
  @Get(':brandId')
  async getBrand(@Param('brandId' , ObjectIdPipe) brandId: Types.ObjectId) : Promise<IBrand> {
    return await this.brandService.getBrand(brandId);
  }
  
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_UPDATE)
  @Patch('soft-delete/:brandId')
  async softDelete(@Param('brandId' , ObjectIdPipe) brandId: Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return await this.brandService.softDelete(brandId , user);
  }
  
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_UPDATE)
  @Patch('restore/:brandId')
  async restore(@Param('brandId' , ObjectIdPipe) brandId: Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return await this.brandService.restore(brandId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.BRAND_DELETE)
  @Delete('remove/:brandId')
  async removeBrand(@Param('brandId' , ObjectIdPipe) brandId: Types.ObjectId , @User() user : HUserDocument):Promise<string> {
    return await this.brandService.removeBrand(brandId , user);
  }
}
