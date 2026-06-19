import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import { CategoryController } from './category.controller';
import { CategoryModel } from 'src/DB/models';
import { CategoryRepository } from 'src/DB/Repository';
import { SharedAuthenticationModule } from 'src/common/modules';
import { S3Service } from 'src/common/service';

@Module({
  imports : [CategoryModel , SharedAuthenticationModule],
  controllers: [CategoryController],
  providers: [CategoryService , CategoryRepository , S3Service],
})
export class CategoryModule {}
