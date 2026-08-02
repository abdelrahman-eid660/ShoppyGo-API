import type{ HUserDocument } from 'src/DB/models';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Auth, CacheKey, PermissionsDecorator, User } from 'src/common/decorator';
import { CacheKeyEnum, PermissionEnum, RoleEnum } from 'src/common/enum';
import { PaginationDTO } from 'src/common/dto';
import { Types } from 'mongoose';
import { ObjectIdPipe } from 'src/common/pipe';
import { ICategory, IPagination } from 'src/common/interface';
import { CustomeCacheInterceptor } from 'src/common/interceptor';
import { Throttle } from '@nestjs/throttler';
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.CATEGORY_CREATE)
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @Post('create-category')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto , @User() user : HUserDocument) {
    return await this.categoryService.createCategory(user , createCategoryDto);
  }

  @Auth({isPublic : true})
  @CacheKey(CacheKeyEnum.CATEGORY)
  @UseInterceptors(CustomeCacheInterceptor)
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.CATEGORY_VIEW)
  @Get('get-all-categories')
  async getAllCategories(@Query() query : PaginationDTO) : Promise<IPagination<ICategory>> {
    return await this.categoryService.getAllCategories(query);
  }
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR]})
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.CATEGORY_VIEW)
  @Get('get-all-categories-archive')
  async getAllCategoriesArchive(@Query() query : PaginationDTO): Promise<IPagination<ICategory>> {
    return await this.categoryService.getAllCategoriesArchive(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.CATEGORY_VIEW)
  @Get('get-category/:categoryId')
  getCategory(@Param('categoryId' , ObjectIdPipe) categoryId: Types.ObjectId) : Promise<ICategory> {
    return this.categoryService.getCategory(categoryId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.CATEGORY_UPDATE)
  @Patch(':categoryId/update')
  async updateCategory(@User() user : HUserDocument , @Param('categoryId' , ObjectIdPipe) categoryId: Types.ObjectId, @Body() data: UpdateCategoryDto):Promise<ICategory> {
    return await this.categoryService.updateCategory(user , categoryId, data);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.CATEGORY_UPDATE)
  @Patch('soft-delete/:categoryId')
  async softDelete(@Param('categoryId', ObjectIdPipe) categoryId: Types.ObjectId , @User() user : HUserDocument) : Promise<string> {
    return await this.categoryService.softDelete(categoryId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.CATEGORY_UPDATE)
  @Patch('restore/:categoryId')
  async restoreCategory(@Param('categoryId', ObjectIdPipe) categoryId: Types.ObjectId , @User() user : HUserDocument) : Promise<string> {
    return await this.categoryService.restoreCategory(categoryId , user);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  @PermissionsDecorator(PermissionEnum.CATEGORY_DELETE)
  @Delete('remove/:categoryId')
  async removeCategory(@Param('categoryId', ObjectIdPipe) categoryId: Types.ObjectId , @User() user : HUserDocument) : Promise<string> {
    return await this.categoryService.removeCategory(categoryId , user);
  }
}
