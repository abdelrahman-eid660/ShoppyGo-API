import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import { S3Service } from 'src/common/service';
import { BrandModel, CategoryModel, ProductModel } from 'src/DB/models';
import { BrandRepository, CategoryRepository, ProductRepository } from 'src/DB/Repository';

@Module({
  imports : [SharedAuthenticationModule , ProductModel , CategoryModel , BrandModel ],
  controllers: [ProductController],
  providers: [ProductService , S3Service , ProductRepository , CategoryRepository , BrandRepository],
})
export class ProductModule {}
