import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { BrandModel, CategoryModel, ProductModel } from 'src/DB/models';
import { BrandRepository, CategoryRepository, ProductRepository } from 'src/DB/Repository';
import { SharedAuthenticationModule } from 'src/common/modules';
import { S3Service } from 'src/common/service';
import { DatabaseService } from 'src/DB/service/database.service';

@Module({
  imports : [CategoryModel , SharedAuthenticationModule , BrandModel , ProductModel],
  controllers: [CategoryController],
  providers: [CategoryService , CategoryRepository , BrandRepository , S3Service , ProductRepository , DatabaseService],
})
export class CategoryModule {}
