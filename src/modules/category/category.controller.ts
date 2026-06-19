import type{ HUserDocument } from 'src/DB/models';
import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Auth, PermissionsDecorator, User } from 'src/common/decorator';
import { PermissionEnum, RoleEnum } from 'src/common/enum';
import { PaginationDTO } from 'src/common/dto';
@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  
  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.CATEGORY_CREATE)
  @Post('create-category')
  async createCategory(@Body() createCategoryDto: CreateCategoryDto , @User() user : HUserDocument) {
    return await this.categoryService.createCategory(user , createCategoryDto);
  }

  @Auth({})
  @PermissionsDecorator(PermissionEnum.CATEGORY_VIEW)
  @Get('get-all-categories')
  async getAllCategories(@Query() query : PaginationDTO) {
    return await this.categoryService.getAllCategories(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN, RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.CATEGORY_VIEW)
  @Get('get-all-categories-archive')
  async getAllCategoriesArchive(@Query() query : PaginationDTO) {
    return await this.categoryService.getAllCategoriesArchive(query);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN , RoleEnum.SUPERVISOR]})
  @PermissionsDecorator(PermissionEnum.CATEGORY_VIEW)
  @Get('get-category/:categoryId')
  getCategory(@Param('categoryId') categoryId: string) {
    return this.categoryService.getCategory(categoryId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.CATEGORY_UPDATE)
  @Patch(':categoryId/update')
  async updateCategory(@User() user : HUserDocument , @Param('categoryId') categoryId: string, @Body() data: UpdateCategoryDto) {
    return await this.categoryService.updateCategory(user , categoryId, data);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.CATEGORY_UPDATE)
  @Patch('soft-delete/:categoryId')
  async softDelete(@Param('categoryId') categoryId: string) {
    return await this.categoryService.softDelete(categoryId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.CATEGORY_UPDATE)
  @Patch('restore/:categoryId')
  async restoreCategory(@Param('categoryId') categoryId: string) {
    return await this.categoryService.restoreCategory(categoryId);
  }

  @Auth({roles : [RoleEnum.ADMIN , RoleEnum.SUPERADMIN]})
  @PermissionsDecorator(PermissionEnum.CATEGORY_DELETE)
  @Delete('remove/:categoryId')
  async removeCategory(@Param('categoryId') categoryId: string) {
    return await this.categoryService.removeCategory(categoryId);
  }
}
