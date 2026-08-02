import { Module } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { SharedAuthenticationModule } from 'src/common/modules';
import { S3Service } from 'src/common/service';
import { BrandModel, CategoryModel, ProductModel, ReviewModel, WishlistModel } from 'src/DB/models';
import { BrandRepository, CategoryRepository, ProductRepository, ReviewRepository, WishlistRepository } from 'src/DB/Repository';
import { ProductResolver } from './product.resolver';
import { DatabaseService } from 'src/DB/service/database.service';

@Module({
  imports : [SharedAuthenticationModule , ProductModel , CategoryModel , BrandModel,    ReviewModel,
      WishlistModel,  ],
  controllers: [ProductController],
  providers: [ProductService , WishlistRepository , ReviewRepository , DatabaseService , S3Service , ProductRepository , CategoryRepository , BrandRepository , ProductResolver],
})
export class ProductModule {}
